<template>
  <div class="unread">
    <div class="unread__line" />
    <span class="unread__label">new messages</span>
    <div class="unread__line" />
  </div>
</template>

<style scoped>
.unread {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
  margin: 4px 0;
}

.unread__line {
  flex: 1;
  height: 1px;
  background: rgba(232, 93, 59, 0.2);
}

.unread__label {
  font-size: 9px;
  color: var(--q-accent-orange);
  letter-spacing: 2px;
  text-transform: uppercase;
}
</style>
