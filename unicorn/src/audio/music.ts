import { EFFECTS, type Effect, type Tone } from './effects'
import { compileSong, type CompiledSong, type Drum, type Song, type Voice, type Wave } from './song'

// Plays one song at a time on a loop, and sound effects over it, synthesized like an old
// 8-bit console: pulse and triangle waves for notes, and noise for drums. Switching songs
// crossfades.

const VOLUME = 0.2
// Effects play a little louder than the music, so they stand out from it.
const EFFECTS_VOLUME = 2.5
// Notes are scheduled this far ahead, by a timer that runs this often (in seconds).
const LOOKAHEAD = 0.15
const TICK = 0.025
const CROSSFADE = 0.4

type Playing = {
  song: Song
  compiled: CompiledSong
  // Everything this song plays goes through this, so it can fade out on its own.
  gain: GainNode
  step: number
  nextTime: number
}

class Music {
  private context: AudioContext | null = null
  // Everything goes through the master volume, which muting turns down; effects also go
  // through their own.
  private master: GainNode | null = null
  private effects: GainNode | null = null
  private waves = new Map<Wave, PeriodicWave>()
  private noiseBuffer: AudioBuffer | null = null
  private playing: Playing | null = null
  // The song asked for, which may be waiting for the audio to be unlocked.
  private wanted: Song | null = null
  private muted = false

  // Browsers only allow sound once the user has interacted with the page; call this from
  // a key press or click. It starts the wanted song the first time.
  unlock() {
    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = this.muted ? 0 : VOLUME
      this.master.connect(this.context.destination)
      this.effects = this.context.createGain()
      this.effects.gain.value = EFFECTS_VOLUME
      this.effects.connect(this.master)
      document.addEventListener('visibilitychange', this.handleVisibility)
      window.setInterval(this.schedule, TICK * 1000)
      if (this.wanted) this.start(this.wanted)
    }
    if (this.context.state === 'suspended' && !document.hidden) void this.context.resume()
  }

  play(song: Song) {
    this.wanted = song
    if (this.context && this.playing?.song !== song) this.start(song)
  }

  // Plays a sound effect, unless sound hasn't been unlocked yet.
  effect(name: Effect) {
    const context = this.context
    if (!context || context.state !== 'running') return
    const now = context.currentTime + 0.01
    for (const tone of EFFECTS[name]) this.tone(tone, now + tone.at)
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (!this.context || !this.master) return
    this.master.gain.setTargetAtTime(muted ? 0 : VOLUME, this.context.currentTime, 0.05)
  }

  // Silent while the page is hidden, rather than falling behind and catching up.
  private handleVisibility = () => {
    if (document.hidden) void this.context?.suspend()
    else void this.context?.resume()
  }

  private start(song: Song) {
    const context = this.context!
    const now = context.currentTime
    const old = this.playing
    if (old) {
      old.gain.gain.setTargetAtTime(0, now, CROSSFADE / 4)
      setTimeout(() => old.gain.disconnect(), CROSSFADE * 2000)
    }
    const gain = context.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(1, now + CROSSFADE)
    gain.connect(this.master!)
    this.playing = { song, compiled: compileSong(song), gain, step: 0, nextTime: now + 0.05 }
  }

  // Queues every step that starts before the lookahead runs out.
  private schedule = () => {
    const context = this.context
    const playing = this.playing
    if (!context || !playing || context.state !== 'running') return
    const { compiled } = playing
    // Fell behind (the timer was throttled): carry on from now instead of rushing.
    if (playing.nextTime < context.currentTime) playing.nextTime = context.currentTime + 0.05
    while (playing.nextTime < context.currentTime + LOOKAHEAD) {
      for (const event of compiled.events[playing.step]) {
        if (event.kind === 'drum')
          this.drum(event.drum, event.volume, playing.nextTime, playing.gain)
        else {
          const { voice, frequency } = event
          const seconds = event.steps * compiled.stepSeconds
          const play = (time: number, volume: number) =>
            this.note(voice, frequency, time, seconds, volume, playing.gain)
          play(playing.nextTime, voice.volume)
          if (voice.echo) {
            const delay = voice.echo.delay * compiled.stepSeconds
            play(playing.nextTime + delay, voice.volume * voice.echo.volume)
          }
        }
      }
      playing.nextTime += compiled.stepSeconds
      playing.step = (playing.step + 1) % compiled.steps
    }
  }

  // A square wave whose high part lasts `duty` of each cycle, from its Fourier series.
  private pulse(wave: Wave): PeriodicWave {
    const cached = this.waves.get(wave)
    if (cached) return cached
    const duty = wave === 'pulse12' ? 0.125 : wave === 'pulse25' ? 0.25 : 0.5
    const harmonics = 64
    const real = new Float32Array(harmonics)
    const imag = new Float32Array(harmonics)
    for (let n = 1; n < harmonics; n++) {
      real[n] = Math.sin(2 * Math.PI * n * duty) / (n * Math.PI)
      imag[n] = (1 - Math.cos(2 * Math.PI * n * duty)) / (n * Math.PI)
    }
    const periodic = this.context!.createPeriodicWave(real, imag)
    this.waves.set(wave, periodic)
    return periodic
  }

  private note(
    voice: Voice,
    frequency: number,
    time: number,
    seconds: number,
    volume: number,
    output: AudioNode,
  ) {
    const context = this.context!
    const oscillator = this.oscillator(voice.wave)
    oscillator.frequency.value = frequency

    const end = time + seconds
    if (voice.vibrato) {
      const lfo = context.createOscillator()
      const depth = context.createGain()
      lfo.frequency.value = voice.vibrato.rate
      depth.gain.value = frequency * (2 ** (voice.vibrato.depth / 1200) - 1)
      lfo.connect(depth).connect(oscillator.frequency)
      lfo.start(time)
      lfo.stop(end + 0.2)
    }

    // A quick attack, a fall to the sustain level, and a short release at the end.
    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0, time)
    envelope.gain.linearRampToValueAtTime(volume, time + 0.005)
    envelope.gain.setTargetAtTime(volume * voice.sustain, time + 0.005, voice.decay / 3)
    envelope.gain.setTargetAtTime(0, end - 0.01, 0.015)
    oscillator.connect(envelope).connect(output)
    oscillator.start(time)
    oscillator.stop(end + 0.1)
  }

  // One tone of an effect: a sharp start, then a fade out while the pitch slides.
  private tone(tone: Tone, time: number) {
    const context = this.context!
    const end = time + tone.length
    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0, time)
    envelope.gain.linearRampToValueAtTime(tone.volume, time + 0.003)
    envelope.gain.exponentialRampToValueAtTime(0.001, end)
    envelope.connect(this.effects!)

    if (tone.wave === 'noise') {
      // Noise through a filter centered on `from` Hz.
      this.noise('bandpass', tone.from, time, end).connect(envelope)
      return
    }
    const oscillator = this.oscillator(tone.wave)
    oscillator.frequency.setValueAtTime(tone.from, time)
    if (tone.to) oscillator.frequency.exponentialRampToValueAtTime(tone.to, end)
    oscillator.connect(envelope)
    oscillator.start(time)
    oscillator.stop(end + 0.02)
  }

  private oscillator(wave: Wave) {
    const oscillator = this.context!.createOscillator()
    if (wave === 'triangle') oscillator.type = 'triangle'
    else oscillator.setPeriodicWave(this.pulse(wave))
    return oscillator
  }

  // White noise from `time` to `end` through a filter at `frequency` Hz. Returns the filter
  // to connect onward.
  private noise(type: BiquadFilterType, frequency: number, time: number, end: number) {
    const context = this.context!
    if (!this.noiseBuffer) {
      this.noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
      const data = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    const source = context.createBufferSource()
    source.buffer = this.noiseBuffer
    const filter = context.createBiquadFilter()
    filter.type = type
    filter.frequency.value = frequency
    source.connect(filter)
    // Start somewhere random in the second of noise, so hits don't all sound the same.
    source.start(time, Math.random() * 0.5)
    source.stop(end)
    return filter
  }

  private drum(drum: Drum, volume: number, time: number, output: AudioNode) {
    const context = this.context!
    const envelope = context.createGain()
    envelope.connect(output)
    const fade = (length: number) => {
      envelope.gain.setValueAtTime(volume, time)
      envelope.gain.exponentialRampToValueAtTime(0.001, time + length)
    }

    if (drum === 'k' || drum === 'd') {
      // A kick drops in pitch; a drip of water rises.
      const oscillator = context.createOscillator()
      const [from, to, length] = drum === 'k' ? [150, 40, 0.15] : [700, 1900, 0.12]
      oscillator.frequency.setValueAtTime(from, time)
      oscillator.frequency.exponentialRampToValueAtTime(to, time + length * 0.6)
      fade(length)
      oscillator.connect(envelope)
      oscillator.start(time)
      oscillator.stop(time + length)
      return
    }

    // Snares and hi-hats are bursts of noise, the hi-hat shorter and higher.
    const length = drum === 's' ? 0.14 : 0.04
    fade(length)
    this.noise('highpass', drum === 's' ? 1200 : 7000, time, time + length).connect(envelope)
  }
}

export const music = new Music()
