<template>
  <div class="meta">
    <div class="article-date">
      <ArticleDate :date="thePage.frontmatter.date" />
    </div>
    <div class="reading-time">
      <ReadingTime :readingTime="thePage.readingTime" />
    </div>
  </div>
</template>
<script>
import ReadingTime from './ReadingTime';
import ArticleDate from './ArticleDate';
import Icon from './Icon';
export default {
  name: 'BlogEntryMeta',
  props: ['thePage'],
  components: {
    ReadingTime,
    ArticleDate,
    Icon,
  },
};
</script>
<style lang="stylus" scoped>
.meta
  margin .8em 0
  display flex
  .article-date
    margin-right 15px
</style>
