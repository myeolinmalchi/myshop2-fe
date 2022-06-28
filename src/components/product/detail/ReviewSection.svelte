<script lang="ts">
    export let productId: number;
    export let review;
    export let product: object;
    import { onMount } from 'svelte';
    import { URL } from '../../../common.ts';

    let reviews;
    let page;
    let pageCount;
    let reviewDetailsShown;
    onMount(async () => {
        const res = await fetch(`${URL}/api/v1/product/${productId}/reviews`);
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
            `${URL}/api/v1/product/${productId}/reviews?page=${page}`,
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

    let currentDetailImage: string = '';

    let reviewWrite: boolean = false;

    let reviewProductInfo;

    const writeReviewCheck = async () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token || !userId) {
            alert('로그인 후 이용 가능합니다.');
            return;
        }
        const res = await fetch(
            `${URL}/api/v1/user/${userId}/product/${productId}/info`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
            },
        );
        if (res.status === 404) {
            alert('구매내역이 없습니다.');
        } else if (res.status === 401) {
            alert('로그인 후 이용 가능합니다.');
            localStorage.clear();
        } else if (res.status === 200) {
            reviewProductInfo = await res.json();
            reviewWrite = true;
        }
    };

    let images: array = [];
    $: images;

    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

    const onFileSelected = async (e) => {
        const image = e.target.files[0];
        const imageStr = await getBase64(image);
        images = [...images, imageStr];
    };

    let rating: number;
    let title: string;
    let content: string;

    const writeReview = async () => {
        if (images.length === 0) {
            alert('이미지를 하나 이상 업로드 해야합니다!');
            return;
        }
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (userId && token) {
            const res = await fetch(`${URL}/api/v1/user/${userId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify({
                    productId: Number(productId),
                    userId,
                    rating,
                    title,
                    content,
                    images,
                    orderProductId: reviewProductInfo.orderProductId,
                }),
            });

            if (res.status === 201) {
                alert('리뷰가 작성되었습니다.');
                reviewWrite = false;
                images = [];
            } else if (res.status === 400) {
                alert('리뷰 작성에 실패했습니다.');
            } else if (res.status === 401) {
                alert('로그인이 필요합니다.');
                reviewWrite = false;
                images = [];
                localStorage.clear();
            }
        }
    };
</script>

{#if reviews}
    <section class="product-review" id="review" bind:this={review}>
        <div class="tit-box">
            <h2 class="section-tit">상품평</h2>
            <p class="section-tit-des">
                - 상품을 구매한 다른 사람들의 리뷰를 살펴보세요
            </p>
            <button class="review-write-btn" on:click={writeReviewCheck}>
                리뷰쓰기
            </button>
        </div>

        {#if reviewWrite}
            <!-- 리뷰작성창 -->
            <div class="review-layer">
                <div class="write-review">
                    <h2 class="form-title">리뷰 작성하기</h2>
                    <div class="review-form-wrap">
                        <div class="product-info">
                            <div class="product-thum">
                                <img
                                    src={product.thumbnail}
                                    alt="임시 썸네일"
                                />
                            </div>
                            <h3 class="product-name">
                                {product.name}
                                <p class="option-name">
                                    {#each reviewProductInfo.details as detail}
                                        {detail.name + ' '}
                                    {/each}
                                </p>
                            </h3>
                        </div>

                        <form action="#" method="post">
                            <fieldset class="star_rating">
                                <legend>별점주기</legend>

                                <h3 class="stars-title">상품은 괜찮았나요?</h3>
                                <div class="stars">
                                    <input
                                        type="radio"
                                        id="star_5"
                                        bind:group={rating}
                                        value={5}
                                        name="star-rating"
                                    /><label for="star_5">5점</label>
                                    <input
                                        type="radio"
                                        id="star_4"
                                        bind:group={rating}
                                        value={4}
                                        name="star-rating"
                                    />
                                    <label for="star_4">4점</label>
                                    <input
                                        type="radio"
                                        id="star_3"
                                        bind:group={rating}
                                        value={3}
                                        name="star-rating"
                                    /><label for="star_3">3점</label>
                                    <input
                                        type="radio"
                                        id="star_2"
                                        bind:group={rating}
                                        value={2}
                                        name="star-rating"
                                    /><label for="star_2">2점</label>

                                    <input
                                        type="radio"
                                        id="star_1"
                                        bind:group={rating}
                                        value={1}
                                        name="star-rating"
                                    /><label for="star_1">1점</label>
                                </div>
                            </fieldset>

                            <fieldset class="write-my-review">
                                <legend>리뷰 내용 작성</legend>
                                <label>
                                    <h3 class="input-name">제목</h3>
                                    <input
                                        type="text"
                                        name="review-title"
                                        required
                                        placeholder="20글자 이내로 제목을 작성해 주세요"
                                        maxlength="20"
                                        bind:value={title}
                                    />
                                </label>

                                <label>
                                    <h3 class="input-name">내용</h3>
                                    <textarea
                                        name="review-context"
                                        required
                                        placeholder="리뷰를 적어주세요!"
                                        bind:value={content}
                                    />
                                </label>
                            </fieldset>

                            <fieldset class="upload-photo">
                                <legend>리뷰 사진 등록</legend>
                                <div class="add-photo">
                                    <label for="uploadPhoto"
                                        >사진 첨부하기 +</label
                                    >
                                    <input
                                        type="file"
                                        name="review-images"
                                        accept=".jpg,.png,.jpeg"
                                        multiple
                                        id="uploadPhoto"
                                        on:change={(e) => onFileSelected(e)}
                                    />
                                </div>
                                <ul>
                                    <!-- 추가되면 li>img를 추가해서 보일 수 있게 하면 좋을것 같아요! -->
                                    {#each images as image, idx}
                                        <li><img src={image} alt={idx} /></li>
                                    {/each}
                                </ul>
                            </fieldset>
                            <div class="form-btn-wrap">
                                <button
                                    class="close-btn"
                                    on:click={() => {
                                        reviewWrite = false;
                                        images = [];
                                    }}
                                >
                                    취소
                                </button>
                                <button
                                    class="review-submit-btn"
                                    on:click={writeReview}
                                >
                                    등록
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <!-- //리뷰작성창 -->
        {/if}
        <div class="review-grp">
            {#each reviews as review, index}
                <article class="user-review">
                    <div class="review_top-box">
                        <h3 class="review_tit">{review.title}</h3>
                        <div class="review_info">
                            <!-- 별은 아이콘으로 대체 -->
                            <p class="review_stars">
                                <span
                                    class="star_rating"
                                    style="width:{review.rating * 20}%"
                                />
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
                                currentDetailImage = review.images[0]?.image;
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
                                        {#each review.images as image, index}
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
                <button on:click={subPage}>&lt;</button>
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
                <button on:click={addPage}>&gt;</button>
            </div>
        </div>
    </section>
{/if}

<style global>
</style>
