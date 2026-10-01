// Petits sons de réussite / d'erreur (Web Audio, aucun fichier, aucune clé).
let ctx: AudioContext | null = null

function tone(freqs: number[], step: number, type: OscillatorType = 'sine') {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx ??= new AC()
    void ctx.resume()
    const t0 = ctx.currentTime
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain()
      o.type = type; o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + i * step)
      g.gain.exponentialRampToValueAtTime(0.12, t0 + i * step + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * step + step)
      o.connect(g).connect(ctx!.destination)
      o.start(t0 + i * step); o.stop(t0 + i * step + step + 0.05)
    })
  } catch { /* son indisponible : on ignore */ }
}

export const playSuccess = () => tone([523.25, 659.25, 783.99, 1046.5], 0.11)
export const playError = () => tone([220, 164.81], 0.16, 'triangle')
