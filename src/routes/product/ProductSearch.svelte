<script lang="ts">
    import Header from '../../components/Header.svelte';
    import { onMount } from 'svelte';
    import { URL } from '../../common.ts';
    import type { Product } from '../../common.ts';

    export let params = {};
    let products: Array<Product>;
    let pageCount: number;
    let size: number;
    let page: number;
    let keyword: string;
    let category: string;
    let sort: number;

    onMount(async () => {
        category = params.category === '0' ? '' : params.category;
        const res = await fetch(
            `${URL}/api/v1/product/search/${params.keyword}?` +
                new URLSearchParams({
                    ...(category && { code: category }),
                    ...(page && { page }),
                    ...(size && { size }),
                    ...(sort && { sort }),
                }),
        );
        const jsonBody = await res.json();

        products = jsonBody.products.map((product) => {
            product.price =
                product.price
                    .toString()
                    .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',') + '원';
            return product;
        });
        pageCount = jsonBody.pageCount;
        size = jsonBody.size;
        page = jsonBody.page;
        keyword = jsonBody.keyword;
        category = jsonBody.category;
        sort = jsonBody.sort;
    });

    $: (async function () {
        const res = await fetch(
            `${URL}/api/v1/product/search/${params.keyword}?` +
                new URLSearchParams({
                    ...(category && { code: category }),
                    ...(page && { page }),
                    ...(size && { size }),
                    ...(sort && { sort }),
                }),
        );
        const jsonBody = await res.json();

        products = jsonBody.products.map((product) => {
            product.price =
                product.price
                    .toString()
                    .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',') + '원';
            return product;
        });
        pageCount = jsonBody.pageCount;
    })();

    const setSize = async (pageSize: number) => {
        size = pageSize;
    };

    $: checkSize = (pageSize: number) => {
        return pageSize === size ? 'active' : '';
    };

    const setSort = (pageSort: number) => {
        sort = pageSort;
    };

    $: checkSort = (pageSort: number) => {
        return pageSort === sort ? 'active' : '';
    };

    $: checkPage = (nowPage: number) => {
        return nowPage === page ? 'active' : '';
    };

    const setPage = (nowPage: number) => {
        page = nowPage;
    };
</script>

<Header />

{#if products}
    <div class="container">
        <h2 class="page-title">
            <span class="search-keyword">{params.keyword}</span>에 대한 검색결과
        </h2>

        <section class="result-option">
            <div class="search-sorting">
                <ul>
                    <li class={checkSort(0)}>
                        <button on:click={() => setSort(0)}>가격 낮은순</button>
                    </li>
                    <li class={checkSort(1)}>
                        <button on:click={() => setSort(1)}>가격 높은순</button>
                    </li>
                    <li class={checkSort(2)}>
                        <button on:click={() => setSort(2)}>리뷰 많은순</button>
                    </li>
                    <li class={checkSort(3)}>
                        <button on:click={() => setSort(3)}>리뷰 적은순</button>
                    </li>
                </ul>
            </div>

            <div class="change-list-size">
                <p class="now-list-size">{size}개씩 보기</p>
                <ul>
                    <li class={checkSize(36)}>
                        <input
                            type="radio"
                            name="listSize"
                            id="listSize-36"
                            on:click={() => setSize(36)}
                        />
                        <label for="listSize-36">36개씩 보기</label>
                    </li>
                    <li class={checkSize(48)}>
                        <input
                            type="radio"
                            name="listSize"
                            id="listSize-48"
                            on:click={() => setSize(48)}
                        />
                        <label for="listSize-48">48개씩 보기</label>
                    </li>
                    <li class={checkSize(60)}>
                        <input
                            type="radio"
                            name="listSize"
                            id="listSize-60"
                            on:click={() => setSize(60)}
                        />
                        <label for="listSize-60">60개씩 보기</label>
                    </li>
                    <li class={checkSize(72)}>
                        <input
                            type="radio"
                            name="listSize"
                            id="listSize-72"
                            on:click={() => setSize(72)}
                        />
                        <label for="listSize-72">72개씩 보기</label>
                    </li>
                </ul>
            </div>
        </section>

        <section class="search-result">
            <ul class="result-list">
                {#each products as product, index}
                    <li>
                        <a href="#/product/detail/{product.productId}">
                            <dl>
                                <dt class="images">
                                    <img
                                        src={product.thumbnail}
                                        alt={product.name}
                                    />
                                </dt>

                                <dd>
                                    <h3 class="product-name">{product.name}</h3>
                                    <strong class="product-price"
                                        >{product.price}</strong
                                    >
                                    <p class="rating_star">
                                        {#if product.rating}
                                            <span class="star"
                                                ><b
                                                    class="rating"
                                                    style="width:{product.rating *
                                                        20}%"
                                                /></span
                                            >
                                            <span class="rating-total-count"
                                                >{product.reviewCount}개 리뷰</span
                                            >
                                        {:else}
                                            <span class="rating-total-count">
                                                리뷰 없음
                                            </span>
                                        {/if}
                                    </p>
                                </dd>
                            </dl>
                        </a>
                    </li>
                {/each}
                <!-- 테스트---------------------------------------------------------------- -->
            </ul>

            <div class="pager">
                <div class="btn-grp prev-btn">
                    <button>&lt;&lt;</button>
                    <button>&lt;</button>
                </div>
                <ul>
                    {#each Array(pageCount) as _, index}
                        <li class={checkPage(index + 1)}>
                            <button on:click={() => setPage(index + 1)}
                                >{index + 1}</button
                            >
                        </li>
                    {/each}
                </ul>
                <div class="btn-grp next-btn">
                    <button>&gt;</button>
                    <button>&gt;&gt;</button>
                </div>
            </div>
        </section>
    </div>
{/if}

<style global>
    .header,
    .footer {
        width: 100%;
        height: 160px;
        line-height: 160px;
        font-size: 30px;
        background-color: #eee;
        text-align: center;
    }

    /* 결과 정렬 */
    .container {
        width: 100%;
        max-width: 1020px;
        margin: 40px auto;
    }

    .container .page-title {
        margin-bottom: 16px;
        font-size: 1.2rem;
        font-weight: 400;
    }
    .container .page-title .search-keyword {
        font-weight: 600;
    }

    .container .result-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .search-sorting ul {
        display: flex;
        gap: 8px;
    }

    .search-sorting ul li button {
        padding: 8px 16px;
        border-radius: 8px;
        border: none;
        color: #666;
        background-color: #eee;
    }

    .search-sorting ul li button:hover,
    .search-sorting ul li.active button {
        color: #eee;
        background-color: #333;
        font-weight: 600;
    }

    .result-option .change-list-size {
        position: relative;
    }

    .result-option .change-list-size:hover ul {
        display: block;
    }

    .change-list-size .now-list-size {
        cursor: pointer;
        padding-right: 24px;
        background: url(../images/ico_dropdown.png) no-repeat right/12px;
    }
    .change-list-size ul {
        display: none;
        padding: 4px 0;
        background-color: #fff;
        border: 1px solid #eee;

        position: absolute;
        top: 100%;
        right: 0;
    }
    .change-list-size ul li {
        padding: 4px 16px;
        text-align: center;
        white-space: nowrap;
    }

    .change-list-size ul li input {
        display: none;
    }
    .change-list-size ul li label {
        cursor: pointer;
    }
    .change-list-size ul li label:hover,
    .change-list-size ul li.active {
        font-weight: 600;
    }

    /* //결과 정렬 */

    .search-result {
        width: 100%;
    }
    .search-result .result-list {
        margin-top: 40px;
    }
    .result-list {
        width: 100%;

        display: flex;
        gap: 32px 24px;
        flex-wrap: wrap;
    }
    .result-list li {
        width: 231px;
    }
    .result-list li a {
        width: 100%;
        color: #333;
    }
    .result-list li a dl {
        width: 100%;
    }
    .result-list li a dl dt {
        height: 231px;
        border: 1px solid #ddd;

        display: flex;
        justify-content: center;
        align-items: center;
    }
    .result-list li a dl dt img {
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 100%;
    }
    .result-list li a dl dd {
        margin-top: 16px;
    }
    .result-list li a dl dd .product-name {
        margin-bottom: 8px;
    }
    .result-list li a dl dd .product-price {
        color: var(--price-color);
    }
    .result-list li a dl dd .rating_star {
        margin-top: 8px;
        height: 16px;
    }
    .rating_star * {
        display: block;
        height: 100%;
        float: left;
    }
    .rating_star .star {
        width: 80px;
        background: url(../images/ico_star-grey.png) repeat-x left center;
        background-size: auto 100%;
        margin-right: 8px;
    }
    .rating_star .star .rating {
        width: 0;
        background: url(../images/ico_star-yellow.png) repeat-x left center;
        background-size: auto 100%;
        font-size: 0;
    }
    .rating_star .rating-total-count {
        font-weight: bold;
        font-size: 16px;
        line-height: 1;
        margin-left: 0px;

        vertical-align: top;
        font-weight: 400;
    }

    /* 페이지네이션 */
    .pager {
        display: flex;
        justify-content: center;
        gap: 24px;

        margin-top: 40px;
    }

    .pager button {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 4px;
    }
    .pager .btn-grp button:hover {
        background-color: #ddd;
    }

    .pager ul {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .pager ul li {
        text-align: center;
        border-radius: 4px;
    }

    .pager ul li button {
        background-color: transparent;
    }

    .pager ul li.active button,
    .pager ul li:hover button {
        text-decoration: underline;
    }
    /* //페이지네이션 */
</style>
