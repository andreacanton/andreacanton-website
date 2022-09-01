<template>
  <header>
    <a class="logo no-effects" href="/">
      <picture>
        <img src="/images/me_thumb.jpg" alt="Andrea Canton - Web Developer" />
      </picture>
      Andrea Canton
    </a>
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
          <ThemeToggler />
        </li>
      </ul>
    </nav>
  </header>
</template>
<script>
import ThemeToggler from './ThemeToggler';
export default {
  name: 'Topbar',
  components: { ThemeToggler },
};
</script>
<style lang="stylus" scoped>
header
  padding 10px 0
  margin-bottom 20px
  display flex
  flex-direction column
  align-items center


a.logo
  display block
  text-decoration none
  color $textColor
  font-size 30px
  font-weight 700
  transition color 120ms ease-in-out
  picture img
      border-radius 50%
      border 2px solid lighten($grey, 30%)
      margin-right: 10px
      transition border-color 120ms ease-in-out
  &:hover
    color: darken($textColor, 50%)
    picture img
      border-color: darken($grey, 20%)
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
@media screen and (min-width: 620px)
  header
    flex-direction row
    justify-content space-between
body.dark-theme
  a.logo
    color $darkTextColor
    picture img
      border-color white
    &:hover
      color: darken($darkTextColor, 50%)
      picture img
        border-color: darken($white, 20%)
</style>
