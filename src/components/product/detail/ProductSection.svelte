<script lang="ts">
    import { onMount } from "svelte";
    import { match, P } from "ts-pattern";
    export let productId: number;

    let product: object;
    let items: array;
    onMount(async () => {
        const res = await fetch(`api/v1/product/${productId}`);
        product = await res.json();
        items = product.optionList.map((option) => option.itemList).flat();
    });

    $: priceWithComma = product?.price
        ?.toString()
        ?.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

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
        ?.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

    let quantity: number = 1;
    const addQuantity = () => {
        quantity += 1;
    };
    const subQuantity = () => {
        if (quantity > 1) quantity -= 1;
    };

    const addCart = async () => {
        const userId: string = localStorage.getItem("userId");
        const token: string = localStorage.getItem("JwtToken");
        const res = await fetch(`api/v1/user/${userId}/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Data-Type": "json",
                Authorization: token,
            },
            body: JSON.stringify({
                userId,
                productId: Number(productId),
                quantity,
                itemList: selectedItems,
            }),
        });
        match(res)
            .with({ status: 201 }, () => alert("상품이 장바구니에 담겼습니다."))
            .with({ status: 400 }, () =>
                alert("상품을 장바구니에 담지 못했습니다.")
            )
            .with({ status: 403 }, async () => {
                const jsonBody = await res.json();
                alert(
                    `상품의 재고가 부족합니다!(남은 재고: ${jsonBody.stock})`
                );
            })
            .with({ status: 409 }, () =>
                alert("상품을 장바구니에 담지 못했습니다.")
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
                    <p class="review-total">
                        <!-- 별 넣을곳 -->
                        {#if product.rating !== 0}
                            {#each Array(product.rating / 2) as _}
                                <i class="bi bi-star-fill text-warning" />
                            {/each}
                            {#if product.rating % 2 === 1}
                                <i class="bi bi-star-half text-warning" />
                            {/if}
                            {#each Array(5 - product.rating / 2 - (product.rating % 2)) as _}
                                <i class="bi bi-star-fill text-warning" />
                            {/each}
                            <span class="total-count"
                                >{product.reviewCount} 상품평</span
                            >
                        {:else}
                            <span class="total-count">리뷰 없음</span>
                        {/if}
                    </p>
                </div>

                <div class="product_price">
                    <input type="hidden" value="@product.price" name="price" />
                    <!-- <p id="price">@product.price 원</p> -->
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

<style>
    @import "stylesheets/product-details.css";
    @import "stylesheets/common.css";
</style>
