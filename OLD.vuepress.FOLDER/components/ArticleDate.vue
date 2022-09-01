<template>
  <span class="article-date" :title="`ben ${theDistanceDate} fa`">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      class="date"
    >
      <path
        class="icon"
        d="M21 3h-3V1h-2v2H8V1H6v2H3v18h18V3zm-2 16H5V8h14v11zM7 10h5v5H7v-5z"
      />
    </svg>
    {{ theDate }}
  </span>
</template>
<script>
import { isValid, format, formatDistanceToNow, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

export default {
  name: 'ArticleDate',
  props: ['date'],
  computed: {
    theDate() {
      const parsedDate = parseISO(this.date);
      return isValid(parsedDate)
        ? format(parsedDate, 'dd/MM/yyyy', { locale: it })
        : this.date;
    },
    theDistanceDate() {
      const parsedDate = parseISO(this.date);
      return isValid(parsedDate)
        ? formatDistanceToNow(parsedDate, { locale: it })
        : this.date;
    },
  },
};
</script>
<style lang="stylus" scoped>
.article-date
  cursor help
.date
  width 1.3em
  height 1.3em
  vertical-align bottom
  .icon
    fill $grey
</style>
