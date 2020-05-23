<template>
  <div class="home">
    <h1>Andrea Canton</h1>
    <div class="summary">
      <h2>Vegetarian web developer</h2>
      <p>Based in Verona, Italy</p>
    </div>
    <nav>
      <ul>
        <li>
          <a href="https://twitter.com/andreacanton" class="no-effects">
            <Icon name="twitter" />
          </a>
        </li>
        <li>
          <a href="https://github.com/andreacanton" class="no-effects">
            <Icon name="github" />
          </a>
        </li>
        <li>
          <a href="https://dev.to/andreacanton" class="no-effects">
            <Icon name="devto" />
          </a>
        </li>
        <li>
          <a v-if="haveBlogEntries" href="/blog" class="blog">
            blog
          </a>
        </li>
      </ul>
    </nav>
    <picture>
      <img src="/images/me.jpg" alt="Andrea Canton Web Developer" />
    </picture>
  </div>
</template>
<script>
import Icon from './Icon';
export default {
  components: {
    Icon,
  },
  computed: {
    haveBlogEntries() {
      const blogPages = this.$site.pages.filter(
        p =>
          /^\/blog\/.+$/.test(p.path) &&
          p.title &&
          p.frontmatter.when &&
          !p.frontmatter.draft
      );
      return blogPages.length > 0;
    },
  },
};
</script>
<style lang="stylus" scoped>
.home
  text-align center
h1
  font-size 70px
  font-family 'Rubik', sans-serif;

.summary
  font-size 30px
  font-family 'JetBrains Mono'
  margin-bottom: 2em;
  h2
    font-size inherit
    font-weight 400
    margin 0
  p
    margin 0

nav
  font-family 'JetBrains Mono'
  ul
    list-style none
    display flex
    justify-content center
    align-items center
    li
      margin 0 15px
      a.blog
        text-decoration none
        color $textColor
        font-size 18px
        font-weight 700
        background-image linear-gradient(transparent 0%, transparent 50%, rgba(112, 112, 112, 0.35) 50%, rgba(112, 112, 112, 0.35) 100%)
        background-size 100% 200%
        word-break break-word
        padding 2px 0px 1px
        transition background-position 120ms ease-in-out 0s, padding 120ms ease-in-out 0s
        background-position 0px 0px
        &:hover
          background-image: linear-gradient(transparent 0%, transparent 50%, $grey 50%, $grey 100%)
          color rgb(33, 36, 40)
          background-position 0px 100%
          color: $darkTextColor
picture
  img
    width 100%
</style>