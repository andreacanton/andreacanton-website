<template>
  <button @click="toggleTheme()">
    <Icon name="light" v-if="isDarkTheme" />
    <Icon name="dark" v-else />
  </button>
</template>
<script>
import Icon from './Icon';

export default {
  name: 'ThemeToggler',
  components: {
    Icon,
  },
  data() {
    return {
      isDarkTheme: false,
    };
  },
  methods: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      if (this.isDarkTheme) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
    },
  },
  beforeMount() {
    this.isDarkTheme = localStorage.getItem('theme') == 'dark';
  },
};
</script>
<style lang="stylus" scoped>
button
  border none
  background none
  padding 0
  cursor pointer
  &:focus
    outline none
</style>
