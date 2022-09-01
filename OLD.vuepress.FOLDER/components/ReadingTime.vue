<template>
  <span class="reading-time" title="tempo di lettura (245 ppm)">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      class="hourglass"
    >
      <path
        class="icon"
        d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z"
      />
    </svg>
    {{ theReadingTime }}</span
  >
</template>
<script>
export default {
  name: 'ReadingTime',
  props: ['readingTime'],
  computed: {
    theReadingTime() {
      return `${Math.ceil(this.readingTime.minutes)} min`;
    },
  },
};
</script>
<style lang="stylus" scoped>
.reading-time
  cursor help
.hourglass
  width 1.3em
  height 1.3em
  vertical-align bottom
  .icon
    fill $grey
</style>
