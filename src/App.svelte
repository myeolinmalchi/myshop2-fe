<script lang="ts">
    import Router from "svelte-spa-router";
    import { link } from "svelte-spa-router";
    import Header from "./components/Header.svelte";
    import HeaderTest from "./components/HeaderTest.svelte";

    // routes for product
    import ProductSearch from "./routes/product/ProductSearch.svelte";
    import ProductDetail from "./routes/product/ProductDetail.svelte";

    // routes for user
    import Login from "./routes/user/Login.svelte";
    import Regist from "./routes/user/Regist.svelte";

    const routes = {
        "/product/search/:category/:productId": ProductSearch,
        "/product/detail/:productId": ProductDetail,
        "/login": Login,
        "/regist": Regist,
    };
</script>

<main>
    <Router {routes} />
</main>
