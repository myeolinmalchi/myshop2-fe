<script lang="ts">
    import { onMount } from 'svelte';

    import ProductSection from '../../components/product/detail/ProductSection.svelte';
    import ReviewSection from '../../components/product/detail/ReviewSection.svelte';
    import QnaSection from '../../components/product/detail/QnaSection.svelte';
    import Header from '../../components/Header.svelte';

    import '../../../public/build/stylesheets/product-details.css';
    import '../../../public/build/stylesheets/common.css';

    export let params = {};

    let details: HTMLElement;
    let review: HTMLElement;
    let qna: HTMLElement;

    let scrollY: number;

    let product: object;

    $: detailsStatus = scrollY < review?.offsetTop ? 'active' : '';
    $: reviewStatus =
        scrollY >= review?.offsetTop && scrollY < qna?.offsetTop
            ? 'active'
            : '';

    $: qnaStatus = scrollY >= qna?.offsetTop ? 'active' : '';
</script>

<Header />

<svelte:window bind:scrollY />

<div class="container">
    <ProductSection productId={params.productId} bind:product />

    <!-- start tab-area -->
    <div class="tab-contents">
        <div class="inner">
            <div class="product_tab-titles">
                <ul>
                    <li
                        on:click={() => (scrollY = details.offsetTop)}
                        class={detailsStatus}
                    >
                        <span>상세정보</span>
                    </li>
                    <li
                        class={reviewStatus}
                        on:click={() => (scrollY = review.offsetTop)}
                    >
                        <span>상품평</span>
                    </li>
                    <li
                        class={qnaStatus}
                        on:click={() => (scrollY = qna.offsetTop)}
                    >
                        <span>상품문의</span>
                    </li>
                </ul>
            </div>
            <section class="product-detail" id="details" bind:this={details}>
                <!-- 임시 상세이미지 -->
                <img src={product?.detailInfo} alt={product?.name} />
                <!-- //임시 상세이미지 -->
            </section>

            <ReviewSection
                bind:review
                productId={params.productId}
                bind:product
            />

            <QnaSection bind:qna productId={params.productId} />
        </div>
    </div>
</div>

<style>
    @charset 'utf-8';
    body {
        color: #333;
    }

    button {
        cursor: pointer;
    }

    .header,
    .footer {
        width: 100%;
        height: 160px;
        line-height: 160px;
        font-size: 30px;
        background-color: #eee;
        text-align: center;
    }

    .footer {
        margin-top: 80px;
    }

    .container .product_top-info {
        margin-top: 40px;
    }
    .container .product_top-info .inner {
        display: flex;
    }

    .product_top-info .product_thum {
        display: flex;
        width: 50%;
    }

    .product_thum .thum_img-list ul li {
        width: 70px;
        cursor: pointer;
    }
    .product_thum .thum_img-list ul li ~ li {
        margin-top: 8px;
    }

    .product_thum .thum_img-list ul li.active {
        outline: 2px solid #eee;
    }

    .product_thum .thum_img-list li img {
        width: 100%;
    }

    .thum_main-img {
        max-width: 500px;
        margin-left: 16px;
        flex-shrink: 1;
    }
    .thum_main-img img {
        width: 100%;
    }

    .product_top-info .product_order {
        width: 50%;
        padding-left: 16px;
        box-sizing: border-box;
    }

    .product_order > div {
        padding: 16px 0;
    }

    .product_order .order_tit-box {
        line-height: 1.8;

        border-bottom: 1px solid #ddd;
    }
    .order_tit-box .product-name {
        font-size: 18px;
    }

    .order_tit-box .rating_star {
        margin-left: 4px;

        height: 24px;
    }

    .order_tit-box .rating_star * {
        display: block;
        height: 100%;
        float: left;
    }

    .order_tit-box .rating_star .star {
        width: 120px;
        background: url(../img/ico_star-grey.png) repeat-x left center;
    }

    .order_tit-box .rating_star .star .rating {
        width: 0;
        background: url(../img/ico_star-yellow.png) repeat-x left center;
        font-size: 0;
    }

    .order_tit-box .rating_star .rating-total-count {
        color: var(--acent-color);
        font-weight: bold;
        font-size: 16px;
        margin-left: 8px;
        background-color: #fff;

        vertical-align: top;
    }

    .product_order .product_price {
        font-size: 20px;
        font-weight: 600;
        color: var(--price-color);

        border-bottom: 1px solid #ddd;
    }

    .product_order .product_option-box {
        border-bottom: 1px solid #ddd;
    }

    .product_order .product_option-box .option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
    }

    .product_order .product_option-box .option ~ .option {
        margin-top: 16px;
    }

    .option select {
        -moz-appearance: none;
        -webkit-appearance: none;
        appearance: none;

        flex-grow: 1;
        padding: 12px;
        border-radius: 4px;
        outline: none;
    }
    .option select:focus {
        border: 1px solid var(--acent-color);
        outline: 1px solid var(--acent-color);
    }
    .product_order .total-price {
        display: flex;
        justify-content: space-between;
    }

    /*  --------------------  주문 버튼들 ------------------- */

    .product_order .order-btn-grp {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        border-bottom: none;
    }
    .order-btn-grp button {
        background-color: #fff;
        border: none;
        line-height: 48px;
        letter-spacing: -0.6px;

        font-weight: 600;
        cursor: pointer;
    }

    .order-btn-grp .order_count {
        display: flex;
        justify-content: space-between;
    }
    .order_count button {
        width: 40px;
        border: 2px solid #ddd;
    }

    .order_count button:hover {
        color: var(--acent-color);
        border-color: var(--acent-color);
    }

    button.count_minus-btn {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
    }
    button.count_plus-btn {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
    }

    .order_count input.count-number {
        width: 64px;
        text-align: center;
        outline: none;
        border: none;
        border-top: 2px solid #ddd;
        border-bottom: 2px solid #ddd;
    }

    .order_count input[type='number']::-webkit-outer-spin-button,
    .order_count input[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .order-btn-grp .buy-now_btn,
    .order-btn-grp .add-cart_btn {
        width: 160px;
        border-radius: 4px;
    }

    .order-btn-grp .add-cart_btn {
        border: 2px solid #ddd;
    }

    .order-btn-grp .buy-now_btn {
        background-color: #ddd;
    }

    .order-btn-grp .add-cart_btn:hover {
        border-color: var(--acent-color);
        color: var(--acent-color);
    }

    .order-btn-grp .buy-now_btn:hover {
        background-color: var(--acent-color);
        color: #fff;
    }
    /*  --------------------  //주문 버튼들 ------------------- */

    /* ---------------------- 탭메뉴 콘텐츠 ----------------------*/

    .container .tab-contents {
        margin-top: 60px;
    }

    .container .tab-contents section ~ section {
        margin-top: 80px;
        padding-top: 80px;
    }

    .container .tab-contents .product_tab-titles {
        position: sticky;
        top: 0;
        z-index: 888;
    }
    .product_tab-titles ul {
        display: flex;
    }
    .product_tab-titles ul li {
        width: 25%;
        line-height: 60px;
        text-align: center;

        background-color: #eee;
        border-right: 1px solid #ccc;
        border-bottom: 1px solid #ccc;
        border-top: 2px solid #999;
    }

    .product_tab-titles ul li:hover {
        font-weight: bold;
    }

    .product_tab-titles ul li:first-child {
        border-left: 1px solid #ccc;
    }

    .product_tab-titles ul li.active {
        background-color: #fff;
        border-bottom: none;
        font-weight: bold;
    }

    .product_tab-titles ul li a {
        display: block;
        color: #333;
    }

    .container .tab-contents .product-detail {
        display: flex;
        justify-content: center;
        padding: 80px 0;
    }
    .product-detail img {
        max-width: 90%;
    }

    /* ---------------------- //탭메뉴 콘텐츠 ----------------------*/
    /* -----------------------------------------리뷰 && 문의 공통 */

    .tit-box {
        line-height: 80px;
        display: flex;
        gap: 40px;
        padding: 0 30px;
        border-radius: 8px;
        background-color: #ddd;
        margin-bottom: 32px;

        position: relative;
    }
    .section-tit {
        font-size: 1.5rem;
        letter-spacing: 0.6px;
    }

    :global(.tit-box [class$='btn']) {
        display: block;
        padding: 8px 24px;
        border-radius: 4px;
        line-height: 2;
        background-color: #fff;
        border: none;

        font-weight: 600;
        color: #333;

        position: absolute;
        right: 30px;
        top: 50%;
        transform: translateY(-50%);
    }

    :global(.tit-box [class$='btn']:hover) {
        background-color: var(--acent-color);
        color: #fff;
    }

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
    /* ------------------------------------------//리뷰 && 문의 공통 */
</style>
