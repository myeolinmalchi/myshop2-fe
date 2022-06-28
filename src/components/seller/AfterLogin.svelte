<script lang="ts">
    import { push } from 'svelte-spa-router';

    const productRegist = () => {
        push('/seller/product/regist');
    };

    const logout = () => {
        localStorage.clear();
        window.location.reload();
    };
</script>

<div class="container">
    <h2 class="page-title">MY SHOP<br />판매자 페이지</h2>
    <div class="btn-group">
        <button class="product-registration" on:click={productRegist}
            >상품등록</button
        >
        <button class="logout" on:click={logout}>로그아웃</button>
    </div>
</div>

<style>
    .container {
        width: 100%;
        height: 100vh;

        display: flex;
        justify-content: center;
        align-items: center;

        position: relative;
    }
    .page-title {
        font-size: 3rem;
        text-align: center;
        color: #333;

        position: absolute;
        top: 20%;
    }

    .btn-group button {
        display: block;
        width: 300px;
        line-height: 4;
        border: 2px solid #999;
        border-radius: 8px;

        font-size: 1.6rem;
    }

    .btn-group button:hover {
        background-color: #333;
        color: #fff;
    }

    .btn-group button:first-child {
        margin-bottom: 16px;
    }
</style>
