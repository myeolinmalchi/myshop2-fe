<script lang="ts">
    import { onMount } from "svelte";

    import ProductSection from "../../components/product/detail/ProductSection.svelte";
    import ReviewSection from "../../components/product/detail/ReviewSection.svelte";
    import QnaSection from "../../components/product/detail/QnaSection.svelte";
    import HeaderTest from "../../components/HeaderTest.svelte";
    import "../../../public/build/stylesheets/product-details.css";
    import "../../../public/build/stylesheets/common.css";

    export let params = {};

    let details: HTMLElement;
    let review: HTMLElement;
    let qna: HTMLElement;

    let scrollY: number;

    $: detailsStatus = scrollY < review?.offsetTop ? "active" : "";
    $: reviewStatus =
        scrollY >= review?.offsetTop && scrollY < qna?.offsetTop
            ? "active"
            : "";

    $: qnaStatus = scrollY >= qna?.offsetTop ? "active" : "";
</script>

<svelte:window bind:scrollY />

<div class="container">
    <ProductSection productId={params.productId} />

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
                <img src="img/product-img.jfif" alt="임시 상세이미지" />
                <!-- //임시 상세이미지 -->
            </section>

            <ReviewSection bind:review productId={params.productId} />

            <QnaSection bind:qna productId={params.productId} />
        </div>
    </div>
</div>

<style global>
    @import "stylesheets/product-details.css";
    @import "stylesheets/common.css";
</style>
