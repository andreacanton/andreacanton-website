<template>
  <div class="home">
    <div class="content">
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
    </div>
    <picture>
      <img :src="photoSrc" ref="me" alt="Andrea Canton Web Developer" />
    </picture>
  </div>
</template>
<script>
import { isValid, parseISO } from 'date-fns';
import Icon from './Icon';
export default {
  components: {
    Icon,
  },
  data() {
    return {
      photoSrc: '/images/me.jpg',
    };
  },
  computed: {
    haveBlogEntries() {
      const blogPages = this.$site.pages.filter(
        p =>
          /^\/blog\/.+$/.test(p.path) &&
          p.title &&
          p.frontmatter.date &&
          isValid(parseISO(p.frontmatter.date)) &&
          !p.frontmatter.draft
      );
      return blogPages.length > 0;
    },
  },
  methods: {
    repositionPhoto() {
      const me = this.$refs.me;
      const bodyHeight = document.querySelector('body').offsetHeight;
      const vh = Math.max(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
      );
      const vw = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      );
      if (vh - bodyHeight > 0) {
        me.style = null;
      } else {
        me.style = `position: absolute; bottom: 0; left: ${(vw -
          me.offsetWidth) /
          2}px`;
      }
    },
  },
  beforeMount() {
    this.photoSrc =
      localStorage.getItem('theme') === 'dark'
        ? '/images/me-dark.jpg'
        : '/images/me.jpg';
  },
};
</script>
<style lang="stylus">
html, body, .home, #app, .container
  height 100%
</style>
<style lang="stylus" scoped>
.home
  text-align center
  display flex
  flex-direction column
.content
  flex 1 0 auto
h1
  padding-top 100px
  margin-top 0
  font-size 42px
  font-family 'Rubik', sans-serif;

.summary
  font-size 20px
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
    padding 0
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
          background-position 0px 100%
          color: $darkTextColor
picture
  flex-shrink 0
  img
    width: calc(100% - 10px);
@media screen and (min-width: 620px)
  h1
    font-size 70px
  .summary
    font-size 30px
  picture
    img
      width: 100%;
body.dark-theme
  nav ul li a.blog
    color $lightGrey
    &:hover
      color $white
</style>
