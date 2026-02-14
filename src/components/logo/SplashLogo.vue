<template>
  <canvas ref="canvasRef" style="image-rendering: pixelated" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { buildLogoPixels, PALETTE } from '@/utils/logoPixels'

const emit = defineEmits(['animDone'])

const canvasRef = ref(null)
let rafId = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1

  const px = 7
  const gap = 1.5
  const data = buildLogoPixels(px, gap)
  const totalW = data.cursorX + data.cursorW + 20
  const totalH = data.iconH + 10

  canvas.width = totalW * dpr
  canvas.height = totalH * dpr
  canvas.style.width = `${totalW}px`
  canvas.style.height = `${totalH}px`
  ctx.scale(dpr, dpr)

  const allQU = data.quPixels.map(p => ({
    ...p,
    color: PALETTE.pink,
    delay: 200 + (p.y / totalH) * 400 + Math.random() * 300,
  }))
  const allIRC = data.ircPixels.map(p => ({
    ...p,
    color: PALETTE.teal,
    delay: 600 + (p.y / totalH) * 400 + Math.random() * 300,
  }))

  const allPixels = [...allQU, ...allIRC]
  const cursorDelay = 1400
  const flashDuration = 80
  let cursorState = 'pending'
  let cursorFlashStart = 0
  let done = false

  const startTime = performance.now()

  function draw(now) {
    const t = now - startTime
    ctx.clearRect(0, 0, totalW, totalH)

    for (const p of allPixels) {
      if (t < p.delay) continue
      const age = t - p.delay

      if (age < 60) {
        const flash = 1 - age / 60
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.8})`
        ctx.fillRect(p.x, p.y, px, px)
        ctx.fillStyle = p.color
        ctx.globalAlpha = age / 60
        ctx.fillRect(p.x, p.y, px, px)
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, px, px)
      }
    }

    // Scanline effect
    if (t > 200 && t < 1600) {
      const scanY = ((t - 200) / 1400) * totalH
      const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 4)
      grad.addColorStop(0, 'rgba(255,255,255,0)')
      grad.addColorStop(0.5, 'rgba(255,255,255,0.06)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 20, totalW, 24)
    }

    // Cursor
    if (t >= cursorDelay) {
      if (cursorState === 'pending') {
        cursorState = 'flash'
        cursorFlashStart = t
      }
      if (cursorState === 'flash') {
        const flashAge = t - cursorFlashStart
        if (flashAge < flashDuration) {
          ctx.fillStyle = '#fff'
          ctx.fillRect(data.cursorX, data.cursorY, data.cursorW, data.cursorH)
        } else if (flashAge < flashDuration * 2) {
          const settle = (flashAge - flashDuration) / flashDuration
          ctx.fillStyle = PALETTE.acid
          ctx.globalAlpha = settle
          ctx.fillRect(data.cursorX, data.cursorY, data.cursorW, data.cursorH)
          ctx.globalAlpha = 1
          ctx.fillStyle = `rgba(255,255,255,${1 - settle})`
          ctx.fillRect(data.cursorX, data.cursorY, data.cursorW, data.cursorH)
        } else {
          cursorState = 'on'
        }
      }
      if (cursorState === 'on') {
        const blinkT = (t - cursorFlashStart - flashDuration * 2) % 1000
        if (blinkT < 600) {
          ctx.fillStyle = PALETTE.acid
          ctx.fillRect(data.cursorX, data.cursorY, data.cursorW, data.cursorH)
        }
      }
    }

    // CRT glow lines
    for (let y = 0; y < totalH; y += 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, y, totalW, 1)
    }

    if (t < 4000) {
      rafId = requestAnimationFrame(draw)
    } else {
      // Final static frame
      ctx.clearRect(0, 0, totalW, totalH)
      for (const p of allPixels) {
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, px, px)
      }
      ctx.fillStyle = PALETTE.acid
      ctx.fillRect(data.cursorX, data.cursorY, data.cursorW, data.cursorH)
      for (let y = 0; y < totalH; y += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)'
        ctx.fillRect(0, y, totalW, 1)
      }
      if (!done) {
        done = true
        emit('animDone')
      }
    }
  }

  rafId = requestAnimationFrame(draw)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>
