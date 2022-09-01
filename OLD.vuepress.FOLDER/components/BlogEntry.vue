<template>
  <section class="single-entry">
    <img class="hero" :src="this.$page.frontmatter.image" :alt="$page.title + ' cover'" />
    <BlogEntryMeta :thePage="this.$page" />
    <h1>{{ $page.title }}</h1>
    <Content />
    <footer>
      <p>
        Ti ringrazio per aver dedicato del tempo per leggere una parte della mia
        opinione sulla vita, l'universo e tutto quanto. Se ti sembra che abbia
        detto qualcosa di sbagliato, o vuoi semplicemente dire la tua verità,
        <a :href="twitterLink">fammelo sapere con un tweet</a>. Ok dai, puoi
        <a href="/blog/">leggere altri articoli</a>.
      </p>
      <p class="last-update">Ultimo aggiornamento: {{ theLastUpdated }}</p>
    </footer>
  </section>
</template>
<script>
import { isValid, format, parseISO, parse } from 'date-fns';
import BlogEntryMeta from './BlogEntryMeta';
export default {
  name: 'BlogEntry',
  components: { BlogEntryMeta },
  computed: {
    theDate() {
      const parsedDate = parseISO(this.$page.frontmatter.date);
      return isValid(parsedDate) ? format(parsedDate, 'dd/MM/yyyy') : '';
    },
    twitterLink() {
      const url = `http://www.andreacanton.com${this.$page.path}`;
      const text = `${url} via @andreacanton`;
      return `https://twitter.com/intent/tweet?text=${encodeURI(text)}`;
    },
    theLastUpdated() {
      const parsedDate = new Date(this.$page.lastUpdated);
      console.log(parsedDate);
      return isValid(parsedDate)
        ? format(parsedDate, 'dd/MM/yyyy HH:mm:ss')
        : this.$page.lastUpdated;
    },
  },
};
</script>
<style lang="stylus" scoped>
.hero
  width 100%
  margin-bottom 1em
.meta, footer, .last-update
  font-family 'JetBrains Mono', monospace
footer
  padding 20px 0
.last-update
  font-size 0.7em
</style>
