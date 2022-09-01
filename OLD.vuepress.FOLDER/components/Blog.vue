<template>
  <div>
    <p class="intro">
      Benvenut&#601; nel mio blog! Qui pubblico articoli su quello che faccio,
      che mi succede o che penso. Spesso una combinazione delle tre. Dai
      un'occhiata in giro e se vuoi contattarmi per dirmi la tua mi trovi su
      <a
        href="https://twitter.com/andreacanton"
        title="Profilo twitter di Andrea Canton"
        >Twitter</a
      >.<br />Se invece ti interessano argomenti da sviluppatori software
      seguimi su
      <a
        href="https://dev.to/andreacanton"
        title="Dev.to profile of Andrea Canton"
        >DEV</a
      >.
    </p>
    <div class="blog-entry" v-for="entry in blogPages">
      <BlogEntryMeta :thePage="entry" />
      <h2>
        <a :href="entry.path">{{ entry.title }}</a>
      </h2>
    </div>
  </div>
</template>
<script>
import {
  isValid,
  format,
  formatDistanceToNow,
  parseISO,
  compareDesc,
} from 'date-fns';
import { it } from 'date-fns/locale';
import BlogEntryMeta from './BlogEntryMeta';

export default {
  name: 'Blog',
  components: { BlogEntryMeta },
  computed: {
    blogPages() {
      const blogPages = this.$site.pages.filter(
        p =>
          /^\/blog\/.+$/.test(p.path) &&
          p.title &&
          p.frontmatter.date &&
          isValid(parseISO(p.frontmatter.date)) &&
          !p.frontmatter.draft
      );
      blogPages.sort((a, b) => {
        const aDate = parseISO(a.frontmatter.date);
        const bDate = parseISO(b.frontmatter.date);
        return compareDesc(aDate, bDate);
      });
      return blogPages;
    },
  },
};
</script>
<style lang="stylus" scoped>
.intro
  font-size 1.2em
  margin 1.5em 0 3em
.blog-entry
    font-family 'JetBrains Mono'
    margin-bottom 3em
    h2
      font-size 1.8em
      margin 0
      a
        text-decoration none
        color $textColor
        transition color 120ms ease-in-out
        &:hover
          color: darken($textColor, 50%)
body.dark-theme
  .blog-entry h2 a
    color $darkTextColor
    &:hover
      color: darken($darkTextColor, 50%)
</style>
