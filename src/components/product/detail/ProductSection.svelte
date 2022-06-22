<script lang="ts">
    import { onMount } from 'svelte';
    import { match, P } from 'ts-pattern';
    export let productId: number;

    export let product: object;
    let items: array;
    onMount(async () => {
        const res = await fetch(`api/v1/product/${productId}`);
        product = await res.json();
        items = product.optionList.map((option) => option.itemList).flat();
    });

    $: priceWithComma = product?.price
        ?.toString()
        ?.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');

    let selectedItems = [];
    $: surcharges = selectedItems?.map((itemId) => {
        const temp = items.find((item) => item.productOptionItemId === itemId);
        const surcharge = temp.surcharge;
        return surcharge;
    });
    $: surcharge =
        surcharges?.length === 0 ? 0 : surcharges.reduce((acc, x) => acc + x);

    $: totPrice = (product?.price + surcharge) * quantity;
    $: totPriceWithComma = totPrice
        ?.toString()
        ?.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');

    let quantity: number = 1;
    const addQuantity = () => {
        quantity += 1;
    };
    const subQuantity = () => {
        if (quantity > 1) quantity -= 1;
    };

    const addCart = async () => {
        const userId: string = localStorage.getItem('userId');
        const token: string = localStorage.getItem('token');
        const res = await fetch(`api/v1/user/${userId}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: token }),
            },
            body: JSON.stringify({
                ...(userId && { userId }),
                productId: Number(productId),
                quantity,
                itemList: selectedItems,
            }),
        });
        match(res)
            .with({ status: 201 }, () => alert('상품이 장바구니에 담겼습니다.'))
            .with({ status: 400 }, () =>
                alert('상품을 장바구니에 담지 못했습니다.'),
            )
            .with({ status: 403 }, async () => {
                const jsonBody = await res.json();
                alert(
                    `상품의 재고가 부족합니다!(남은 재고: ${jsonBody.stock})`,
                );
            })
            .with({ status: 409 }, () =>
                alert('상품을 장바구니에 담지 못했습니다.'),
            )
            .exhaustive();
    };
</script>

{#if product}
    <section class="product_top-info">
        <div class="inner">
            <article class="product_thum">
                <div class="thum_img-list">
                    <ul>
                        <!-- 테스트 임시 썸네일 -->
                        <li class="active">
                            <img src={product.thumbnail} alt={product.name} />
                        </li>
                        {#each product.imageList as image}
                            <li>
                                <img src={image.image} alt={product.name} />
                            </li>
                        {/each}
                        <!-- //테스트 임시 썸네일 -->
                    </ul>
                </div>

                <div class="thum_main-img">
                    <!-- 큰 썸네일에 alt값 추가가 필요합니다 -->
                    <!-- <img src="@product.thumbnail" alt="" /> -->

                    <!-- 테스트 임시 썸네일 -->
                    <img src={product.thumbnail} alt="" />
                    <!-- //테스트 임시 썸네일 -->
                </div>
            </article>

            <article class="product_order">
                <div class="order_tit-box">
                    <h2 class="product-name">{product.name}</h2>
                    <p class="rating_star">
                        {#if product.rating}
                            <span class="star">
                                <b
                                    class="rating"
                                    style="width:{product.rating * 20}%"
                                />
                            </span>
                            <span class="rating-total-count"
                                >{product.reviewCount}개 리뷰</span
                            >
                        {:else}
                            <span class="rating-total-count"> 리뷰 없음 </span>
                        {/if}
                    </p>
                </div>

                <div class="product_price">
                    <p id="price">{priceWithComma} 원</p>
                </div>

                <!------------ 옵션 -------------->

                {#each product.optionList as option, index}
                    <div class="product_option-box">
                        <div class="option">
                            <p class="option-name">{option.name}</p>
                            <!-- name 옵션데이터이름을 넣어주세요 -->
                            <select
                                bind:value={selectedItems[index]}
                                name={option.productOptionId}
                            >
                                {#each option.itemList as item}
                                    <option value={item.productOptionItemId}
                                        >{item.name}</option
                                    >
                                {/each}
                            </select>
                        </div>
                    </div>
                {/each}

                <!------------ //옵션 -------------->

                <!------------ 수량조절, 가격 -------------->

                <div class="total-price">
                    <p>총 상품가격</p>
                    <input type="hidden" value={product.price} />
                    <strong id="totPrice">{totPriceWithComma} 원</strong>
                </div>
                <!------------ //수량조절, 가격 -------------->

                <!------------ 구매, 장바구니 버튼 -------------->
                <div class="order-btn-grp">
                    <div class="order_count">
                        <button
                            on:click={subQuantity}
                            class="count_minus-btn"
                            id="sub-quantity">-</button
                        >
                        <input
                            name="quantity"
                            id="quantity"
                            type="number"
                            class="count-number"
                            bind:value={quantity}
                        />
                        <button
                            on:click={addQuantity}
                            class="count_plus-btn"
                            id="add-quantity">+</button
                        >
                    </div>

                    <button
                        class="add-cart_btn"
                        type="button"
                        id="add-cart-button"
                        value="cart"
                        on:click={addCart}
                    >
                        장바구니담기
                    </button>
                    <button class="buy-now_btn" type="button" value="order">
                        구매하기
                    </button>
                </div>
                <!------------ //구매, 장바구니 버튼 -------------->
            </article>
        </div>
    </section>
{/if}

<style global>
    @charset "utf-8";
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
        font-size: 23px;
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
        background: url(../images/ico_star-grey.png) repeat-x left center;
    }

    .order_tit-box .rating_star .star .rating {
        width: 0;
        background: url(../images/ico_star-yellow.png) repeat-x left center;
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
</style>
