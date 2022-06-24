<script lang="ts">
    import Router from 'svelte-spa-router';
    import { link } from 'svelte-spa-router';
    import Header from './components/Header.svelte';

    import Main from './routes/Main.svelte';

    // routes for product
    import ProductSearch from './routes/product/ProductSearch.svelte';
    import ProductDetail from './routes/product/ProductDetail.svelte';
    import ReviewWrite from './routes/product/ReviewWrite.svelte';
    import QnaWrite from './routes/product/QnaWrite.svelte';

    // routes for user
    import Login from './routes/user/Login.svelte';
    import Regist from './routes/user/Regist.svelte';
    import Mypage from './routes/user/Mypage.svelte';

    // routes for cart
    import Carts from './routes/cart/Carts.svelte';

    // routes for seller
    import SellerLogin from './routes/seller/Login.svelte';
    import SellerRegist from './routes/seller/Regist.svelte';
    import ProductRegist from './routes/seller/ProductRegist.svelte';

    const routes = {
        '/': Main,
        '/product/search/:category/:keyword': ProductSearch,
        '/product/detail/:productId': ProductDetail,
        '/login': Login,
        '/regist': Regist,
        '/cart': Carts,
        '/mypage': Mypage,
        '/seller/login': SellerLogin,
        '/seller/regist': SellerRegist,
        '/seller/product/regist': ProductRegist,
    };
</script>

<main>
    <Router {routes} />
</main>
