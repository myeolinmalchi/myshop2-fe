<script lang="ts">
    import { link, push, replace } from 'svelte-spa-router';
    import { onMount } from 'svelte';

    onMount(async () => {
        const res = await fetch(`api/v1/category/main`);
        const jsonBody = await res.json();
        categories = jsonBody;
    });

    $: token = localStorage.getItem('token');

    const logout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        token = '';
    };

    let categories: object;
    let category: string;
    let keyword: string;

    const search = () => {
        push(`/product/search/${category}/${keyword}`);
    };
</script>

<div class="header-container">
    <div class="top">
        <ul class="top-menu">
            {#if token}
                <li class="test">
                    <a href="/" use:link on:click={logout}><p>로그아웃</p></a>
                </li>
            {:else}
                <li class="test">
                    <a href="/regist" use:link><p>회원가입</p></a>
                </li>
                <li class="test">
                    <a href="/login" use:link><p>로그인</p></a>
                </li>
            {/if}
        </ul>
    </div>
    <header>
        <div class="logo">
            <img
                src="images/logo/logosmall2.png"
                alt="logo"
                width="240"
                height="100"
            />
        </div>

        <div class="search">
            <select class="select-space" bind:value={category}>
                <option value="0" selected>전체</option>
                {#if categories}
                    {#each categories as category}
                        <option value={category[0]}>{category[1]}</option>
                    {/each}
                {/if}
            </select>
            <input type="text" placeholder="검색어 입력" bind:value={keyword} />
            <button on:click={search}>검색</button>
        </div>
        <div class="icon">
            <div class="Mypage">
                <a href="/mypage" use:link
                    ><i class="fa fa-user" />
                    <div class="icon-text">마이페이지</div></a
                >
            </div>
            <div class="cart">
                <a href="/cart" use:link
                    ><i class="fa fa-shopping-cart" />
                    <div class="icon-text">장바구니</div></a
                >
            </div>
        </div>
    </header>
    <nav class="navbar">
        <ul class="menu-hedaer">
            <li>
                <a class="category-name" href="#">패션의류/잡화</a>
                <ul class="submenu">
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                </ul>
            </li>
            <li>
                <a class="category-name" href="#">패션의류/잡화</a>
                <ul class="submenu">
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                </ul>
            </li>
            <li>
                <a class="category-name" href="#">패션의류/잡화</a>
                <ul class="submenu">
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                </ul>
            </li>
            <li>
                <a class="category-name" href="#">패션의류/잡화</a>
                <ul class="submenu">
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                </ul>
            </li>
            <li>
                <a class="category-name" href="#">패션의류/잡화</a>
                <ul class="submenu">
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                </ul>
            </li>
            <li>
                <a class="category-name" href="#">패션의류/잡화</a>
                <ul class="submenu">
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                    <li><a class="category-name" href="#">유아동 패션</a></li>
                </ul>
            </li>
        </ul>
        <!--대메뉴 ul-->
    </nav>
</div>

<style global>
    .header {
        display: flex;
        justify-content: row;
        margin-top: 20px;
    }
    .header-container {
        margin: 0 auto;
        width: 1024px;
    }
    .logo {
        margin-top: 10px;
    }

    .top-menu :hover p {
        color: darkgray;
    }

    .test {
        margin-left: 12px;
    }

    .top {
        background-color: ghostwhite;
        width: 100%;
        display: flex;
        flex-direction: row;
    }
    .top p {
        font-size: 12px;
        line-height: 20px;
    }
    .top p:hover {
        color: #a8a8a8;
    }

    .top-menu li {
        display: inline-block;
    }

    .top-menu .test:hover p {
        color: darkgray;
    }

    .search {
        display: flex;
        justify-items: center;
        flex-direction: center;
        margin-top: -4em;
        margin-left: 22em;
        cursor: auto;
        height: 40px;
        width: 380px;
        border: solid 1px #cccccc;
        padding: 0px;
    }

    .select-space {
        border: none;
        width: 30%;
        height: 100%;
        padding: 1px;
    }

    .search > input {
        font-size: 16px;
        border: solid #cccccc 1px;
        padding: 9px;
        border: 0px;
        width: 55%;
        height: 100%;

        float: left;
    }

    .search > button {
        width: 15%;
        height: 100%;
        border: 0px;
        background: #1b5ac2;
        outline: none;
        float: right;
        color: #ffffff;
    }

    .search > button:hover {
        color: white;
        background-color: pink;
    }

    .icon {
        font-size: 22px;
        float: right;

        text-align: center;
        display: flex;
        flex-direction: rows;
        justify-content: row;
        text-decoration: none;
        margin-top: -2.2em;
        margin-right: 10px;
    }

    .category-name {
        color: white;
    }

    .icon a {
        color: #1b5ac2;
    }

    .icon-text {
        text-align: center;
        font-size: 18px;
    }

    .Mypage {
        margin-left: 8em;
    }

    .cart {
        margin-left: 25px;
    }

    .fa:hover {
        color: red;
        transition: 0.8s;
        cursor: pointer;
    }

    nav > ul,
    ol,
    li {
        list-style: none;
    }

    nav {
        width: 100%;
        background-color: #1862b0;
        text-align: center;
        margin-top: 23px;
    }

    nav > * {
        color: white;
    }
    .submenu {
        text-align: center;
        align-items: center;
    }

    ul > a {
        color: white;
    }

    nav {
        border-radius: 8px / 8px;
    }

    nav > ul.menu-hedaer {
        width: 1024px;
        display: flex;
        justify-content: center;
    }

    /* float 해제하기 */
    /* 자식요소가 float가 되어있으면 부모요소는 자식의 높이를 읽지 못합니다. */
    nav > ul.menu-hedaer:after {
        content: '';
        display: block;
        clear: both;
    }

    nav > ul.menu-hedaer > li {
        float: left;
        width: 150px;
        padding: 14px 0;

        /* position:absolute가 위치를 잡는 기준점을 설정합니다. */
        position: relative;
    }

    nav > ul.menu-hedaer > li:hover > a {
        font-weight: bold;
    }

    nav > ul.menu-hedaer > li ul.submenu {
        background-color: #5897da;
        width: 100%; /*150px*/
        height: 0;
        overflow: hidden;
        transition: all 0.5s;

        /* 하단 content가 밀리지 않기 위해서는 position:absolut속성이 필요합니다. */
        position: absolute;
        left: 0;
        top: 49px;
    }

    nav > ul.menu-hedaer > li:hover .submenu {
        padding: 14px 0;
        height: 185px;
    }

    ul.submenu li {
        line-height: 2.4;
    }
    ul.submenu li a:hover {
        text-decoration: underline;
    }
</style>
