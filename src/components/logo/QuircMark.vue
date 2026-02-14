<template>
  <svg :width="totalW * scale" :height="totalH * scale" :viewBox="`0 0 ${totalW} ${totalH}`">
    <rect
      v-for="(p, i) in data.quPixels"
      :key="'q' + i"
      :x="p.x"
      :y="p.y"
      :width="px"
      :height="px"
      :fill="palette.pink"
    />
    <rect
      v-for="(p, i) in data.ircPixels"
      :key="'i' + i"
      :x="p.x"
      :y="p.y"
      :width="px"
      :height="px"
      :fill="palette.teal"
    />
    <rect
      :x="data.cursorX"
      :y="data.cursorY"
      :width="data.cursorW"
      :height="data.cursorH"
      :fill="palette.acid"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { buildLogoPixels, PALETTE } from '@/utils/logoPixels'

const props = defineProps({
  size: { type: Number, default: 28 },
})

const palette = PALETTE
const px = 2.2
const gap = 0.5
const data = buildLogoPixels(px, gap)
const totalW = data.cursorX + data.cursorW
const totalH = data.iconH
const scale = computed(() => props.size / Math.max(totalW, totalH))
</script>
