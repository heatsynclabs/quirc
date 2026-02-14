import { ref, computed, watch } from 'vue'

export function useSearch(messages) {
  const query = ref('')
  const debouncedQuery = ref('')
  let timer = null

  watch(query, (val) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedQuery.value = val
    }, 300)
  })

  const results = computed(() => {
    if (debouncedQuery.value.length < 2) return []
    const q = debouncedQuery.value.toLowerCase()
    return messages.value.filter(m =>
      !m.type && m.text.toLowerCase().includes(q)
    )
  })

  return {
    query,
    results,
  }
}
