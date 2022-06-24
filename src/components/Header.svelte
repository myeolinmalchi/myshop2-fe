<script lang="ts">
    import { link, push, replace } from 'svelte-spa-router';
    import { onMount } from 'svelte';
    import { URL } from '../store.ts';

    onMount(async () => {
        const res = await fetch(`${URL}/api/v1/category/main`);
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
    <nav>
        <ul class="menu-hedaer">
            <li>
                <a class="category-tit" href="#">패션의류/잡화</a>
                <ul class="submenu">
                    <li><a class="sub-tit" href="#">여성패션</a></li>
                    <li><a class="sub-tit" href="#">남성패션</a></li>
                    <li><a class="sub-tit" href="#">남녀 공용 의류</a></li>
                    <li><a class="sub-tit" href="#">유아동 패션</a></li>
                </ul>
            </li>

            <li>
                <a class="category-tit" href="#">뷰티</a>
                <ul class="submenu">
                    <li><a class="sub-tit" href="#">스킨케어</a></li>
                    <li><a class="sub-tit" href="#">메이크업</a></li>
                    <li><a class="sub-tit" href="#">향수</a></li>
                    <li><a class="sub-tit" href="#">헤어</a></li>
                    <li><a class="sub-tit" href="#">로드샵</a></li>
                </ul>
            </li>

            <li>
                <a class="category-tit" href="#">식품</a>
                <ul class="submenu">
                    <li><a class="sub-tit" href="#">냉동/냉장/간편요리</a></li>
                    <li><a class="sub-tit" href="#">과일</a></li>
                    <li><a class="sub-tit" href="#">과자/초콜릿/시리얼</a></li>
                    <li><a class="sub-tit" href="#">생수/음료</a></li>
                    <li><a class="sub-tit" href="#">쌀/잡곡</a></li>
                </ul>
            </li>

            <li>
                <a class="category-tit" href="#">전자기기</a>
                <ul class="submenu">
                    <li><a class="sub-tit" href="#">생활가전</a></li>
                    <li><a class="sub-tit" href="#">청소기</a></li>
                    <li><a class="sub-tit" href="#">냉장고</a></li>
                    <li><a class="sub-tit" href="#">TV</a></li>
                    <li><a class="sub-tit" href="#">게임기기</a></li>
                </ul>
            </li>

            <li>
                <a class="category-tit" href="#">주방용품</a>
                <ul class="submenu">
                    <li><a class="sub-tit" href="#">주방가전</a></li>
                    <li><a class="sub-tit" href="#">냄비/프라이팬</a></li>
                    <li><a class="sub-tit" href="#">주방잡화</a></li>
                    <li><a class="sub-tit" href="#">이유/유아식기</a></li>
                    <li><a class="sub-tit" href="#">보온/보냉용품</a></li>
                </ul>
            </li>
            <li>
                <a class="category-tit" href="#">반려동물 용품</a>
                <ul class="submenu">
                    <li><a class="sub-tit" href="#">사료</a></li>
                    <li><a class="sub-tit" href="#">간식</a></li>
                    <li><a class="sub-tit" href="#">산책용품</a></li>
                    <li><a class="sub-tit" href="#">관상어 용품</a></li>
                    <li><a class="sub-tit" href="#">소동물/가축용품</a></li>
                </ul>
            </li>
        </ul>
    </nav>
</div>

<style>
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

    /* 상단 회원가입, 로그인 부분(회색바) */
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

    /* 검색창 */
    .search {
        display: flex;
        justify-items: center;
        margin-top: -4em;
        margin-left: 22em;
        cursor: auto;
        height: 40px;
        width: 380px;
        border: solid 1px #cccccc;
    }

    .select-space {
        border: none;
        width: 30%;
        height: 100%;
    }

    .search > input {
        font-size: 16px;
        border: solid #cccccc 1px;
        border: 0px;
        float: left;
        width: 55%;
        height: 100%;
    }

    /* 검색창 버튼 */
    button {
        width: 15%;
        height: 100%;
        border: 0px;
        background: #1b5ac2;
        outline: none;
        float: right;
        color: #ffffff;
    }

    button:hover {
        color: white;
        background-color: pink;
    }

    /* 아이콘 */
    .icon {
        font-size: 20px;
        float: right;
        text-align: center;
        display: flex;
        flex-direction: row;
        text-decoration: none;
        margin-top: -2.2em;
    }

    .icon a {
        color: #1b5ac2;
    }

    .icon-text {
        text-align: center;
    }

    .cart {
        margin-left: 25px;
    }

    .Mypage > a:hover {
        color: rgb(248, 176, 176);
        transition: 0.8s;
        cursor: pointer;
    }
    .cart > a:hover {
        color: rgb(248, 176, 176);
        transition: 0.8s;
        cursor: pointer;
    }

    /* 카테고리바 */
    nav {
        width: 100%;
        background-color: #1862b0;
        text-align: center;
        margin-top: 23px;
        color: white;

        border-radius: 8px;
    }

    .submenu {
        text-align: center;
        align-items: center;
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
        color: white;
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
        text-decoration: none;
        color: rgb(255, 218, 218);
        font-weight: bold;
        text-shadow: 2px 2px gray;
    }

    /* 카테고리바 a태그 각각 class 만들고 색지정 해줌 */
    .category-tit,
    .sub-tit {
        color: white;
    }
</style>
