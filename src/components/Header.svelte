<script lang="ts">
    import { link, push } from 'svelte-spa-router';
    import { onMount } from 'svelte';
    import { URL } from '../common.ts';
    import type { Category } from '../common.ts';

    onMount(async () => {
        const res = await fetch(`${URL}/api/v1/category/main`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        const jsonBody = await res.json();
        categories = await Promise.all(
            jsonBody.map(async (category: Array<string>) => {
                const code: string = category[0];
                const name: string = category[1];
                const res = await fetch(
                    `${URL}/api/v1/category/${code}/children`,
                );
                const jsonBody = await res.json();
                const children: Array<Category> = jsonBody.map(
                    (category: Array<string>) => {
                        return {
                            code: category[0],
                            name: category[1],
                        };
                    },
                );
                return { code, name, children };
            }),
        );
    });

    $: token = localStorage.getItem('token');

    const logout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        token = '';
    };

    let categories: Array<Category>;
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
                on:click={() => push('/')}
            />
        </div>

        <div class="search">
            <select class="select-space" bind:value={category}>
                <option value="0" selected>전체</option>
                {#if categories}
                    {#each categories as category}
                        <option value={category.code}>{category.name}</option>
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
            {#if categories}
                {#each categories as category}
                    <li>
                        <a class="category-tit" href="/">{category.name}</a>
                        <ul class="submenu">
                            {#if category.children}
                                {#each category.children as child}
                                    <li>
                                        <a class="sub-tit" href="/"
                                            >{child.name}</a
                                        >
                                    </li>
                                {/each}
                            {/if}
                        </ul>
                    </li>
                {/each}
            {:else}
                <li>
                    <a class="category-tit" href="/">&nbsp;</a>
                </li>
            {/if}
        </ul>
    </nav>
</div>

<style>
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
        width: 55%;
        padding: 9px;
        border: 0px;
        float: left;
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
        z-index: 1;
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
