<script>
    export let productId;
    export let review;
    import { onMount } from "svelte";

    let reviews;
    let page;
    let pageCount;
    let reviewDetailsShown;
    onMount(async () => {
        const res = await fetch(`api/v1/product/${productId}/reviews`);
        const jsonBody = await res.json();
        reviews = jsonBody.reviews.map((review) => {
            const date = new Date(review.reviewDate);
            review.reviewDate = date.toLocaleString();
            return review;
        });
        page = jsonBody.page;
        pageCount = jsonBody.pageCount;
        reviewDetailsShown = Array(5).map((i) => false);
    });

    const setPage = async (page) => {
        const res = await fetch(
            `api/v1/product/${productId}/reviews?page=${page}`
        );
        const jsonBody = await res.json();
        reviews = jsonBody.reviews.map((review) => {
            const date = new Date(review.reviewDate);
            review.reviewDate = date.toLocaleString();
            return review;
        });
        page = jsonBody.page;
        pageCount = jsonBody.pageCount;
    };

    const addPage = () => {
        if (page < pageCount) setPage(page + 1);
    };

    const subPage = () => {
        if (page > 1) setPage(page - 1);
    };

    let currentDetailImage = "";
</script>

{#if reviews}
    <section class="product-review" id="review" bind:this={review}>
        <div class="tit-box">
            <h2 class="section-tit">상품평</h2>
            <p class="section-tit-des">
                - 상품을 구매한 다른 사람들의 리뷰를 살펴보세요
            </p>
        </div>

        <div class="review-grp">
            {#each reviews as review, index}
                <article class="user-review">
                    <div class="review_top-box">
                        <h3 class="review_tit">리뷰 제목</h3>
                        <div class="review_info">
                            <!-- 별은 아이콘으로 대체 -->
                            <p class="review_stars">
                                <span>★</span><span>★</span><span>★</span><span
                                    >★</span
                                >
                                <span>★</span>
                            </p>
                            <!-- 별은 아이콘으로 대체 -->
                            <span class="review_product-info"
                                >{review.name}</span
                            >
                            <span class="review_writing-time"
                                >{review.reviewDate}</span
                            >
                        </div>
                    </div>

                    <div class="review_preview">
                        <div class="review_txt">
                            <p>
                                {review.content}
                            </p>
                            <div class="review_btn-group">
                                <button class="recomend-btn">
                                    <!-- 추천버튼을 누른 뒤 icon -->
                                    <!-- <img src="img/ico-solid_review-recomend.png" alt="내가 추천한 리뷰"> -->
                                    <!-- 추천버튼 누르기 전 icon -->
                                    <img
                                        src="/images/ico-line_review-recomend.png"
                                        alt="이 리뷰 추천하기"
                                    />
                                    <!-- 추천 수 -->
                                    <span>{review.recommend}</span>
                                </button>
                                <a href="#" class="read-more-btn"
                                    >리뷰 내용 더보기 >>
                                </a>
                            </div>
                        </div>
                        <div
                            class="review_photo"
                            on:click={() => {
                                reviewDetailsShown[index] =
                                    !reviewDetailsShown[index];
                            }}
                        >
                            <!-- 
                      현재 사진더보기 팝업창은 display:none
                      상태입니다.
                      이 요소에 click이벤트를 추가하여 display상태를 변경할 수 있도록 해주시면 될것같아요! 
                     -->
                            <img
                                src={review.images[0]?.image}
                                alt={review.images[0]?.sequence}
                            />
                        </div>
                    </div>

                    <!-- 리뷰 사진 더보기 창 -->
                    {#if reviewDetailsShown[index]}
                        <div class="review-detail">
                            <div class="content-box">
                                <button class="prev-btn" />
                                <button class="next-btn" />
                                <button
                                    class="close-btn"
                                    on:click={() =>
                                        (reviewDetailsShown[index] = false)}
                                />
                                <h2 class="section-tit">{review.title}</h2>
                                <div class="photo-box">
                                    <div class="now-photo">
                                        <!-- <img src="img/height-long-test.jpg" alt="1" /> -->
                                        <img src={currentDetailImage} alt="1" />
                                    </div>
                                    <ul>
                                        {#each review.images as image}
                                            <li>
                                                <img
                                                    src={image.image}
                                                    alt={image.sequence}
                                                    on:click={() =>
                                                        (currentDetailImage =
                                                            image.image)}
                                                />
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    {/if}
                    <!-- //리뷰 사진 더보기 창 -->
                </article>
            {/each}
        </div>

        <div class="pager">
            <div class="btn-grp prev-btn">
                <button>&lt;&lt;</button>
                <button>&lt;</button>
            </div>
            <ul>
                {#each Array(pageCount) as _, index}
                    <li>
                        <button on:click={() => setPage(index + 1)}
                            >{index + 1}</button
                        >
                    </li>
                {/each}
            </ul>
            <div class="btn-grp next-btn">
                <button on:click={subPage}>&gt;</button>
                <button on:click={addPage}>&gt;&gt;</button>
            </div>
        </div>
    </section>
{/if}
