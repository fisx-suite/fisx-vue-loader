<template>
    <div id="app">
        <h1>{{ msg }}</h1>
        <img src="a/b.jpg">
        <picture width="500" height="500">
            <source media="(min-width: 18em)" srcset="med-1.jpg 1x, med-2.jpg 2x">
            <img src="small-1.jpg" alt="">
            <p>Accessible text</p>
        </picture>
    </div>
</template>

<script>
    export default {
        name: 'app',
        data () {
            return {
                msg: 'Welcome to Your Vue.js App'
            }
        }
    }
</script>

<style src="./a.css" scoped>
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
    }
</style>
