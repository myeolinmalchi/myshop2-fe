<script lang="ts">
    import { onMount } from 'svelte';
    import { link, push, replace, pop } from 'svelte-spa-router';
    import { URL } from '../../store.ts';

    const refreshCart = async () => {
        let userId = localStorage.getItem('userId');
        let token = localStorage.getItem('token');
        if (userId && token) {
            const res = await fetch(`${URL}/api/v1/user/${userId}/cart`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
            });
            if (res.status === 200) {
                carts = await res.json();
            } else if (res.status === 401) {
                alert('로그인 후 이용 가능합니다.');
                pop();
            }
        } else {
            pop();
            alert('로그인 후 이용 가능합니다.');
        }
    };

    let carts: array;
    let cartChecked: array = [];
    $: priceWithComma = carts?.map((cart) => {
        return cart.price
            ?.toString()
            ?.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
    });
    $: totPrice = carts?.map((cart) => cart.price * cart.quantity);
    $: totPriceWithComma = totPrice?.map((totPrice) => {
        return totPrice
            ?.toString()
            ?.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
    });
    $: totPriceSum = totPrice?.reduce((acc, p, index) => {
        if (cartChecked[index]) {
            return acc + p;
        }
        return acc;
    }, 0);
    onMount(async () => {
        refreshCart();
    });

    const order = async () => {
        const cartIdList = carts
            ?.filter((cart, index) => cartChecked[index])
            .map((cart) => cart.cartId);
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (userId && token) {
            const res = await fetch(`${URL}/api/v1/user/${userId}/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify({
                    cartIdList,
                }),
            });
            if (res.status === 200) {
                alert('주문이 완료되었습니다.');
                pop();
            } else if (res.status === 401) {
                alert('로그인 후 이용 가능합니다.');
                localStorage.clear();
                pop();
            } else if (res.status === 400) {
                alert('주문에 실패했습니다.');
                pop();
            }
        }
    };

    const deleteCart = async (cartId: number) => {
        let userId = localStorage.getItem('userId');
        let token = localStorage.getItem('token');
        const res = await fetch(`${URL}/api/v1/user/${userId}/cart/${cartId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
        });
        if (res.status === 200) {
            refreshCart();
        } else if (res.status === 401) {
            alert('로그인 후 이용 가능힙나디.');
            pop();
        } else {
            alert('장바구니 삭제에 실패했습니다.');
        }
    };

    const deleteSelectedCart = async () => {
        carts.forEach(async (cart, index) => {
            if (cartChecked[index]) {
                deleteCart(cart.cartId);
            }
        });
    };

    const updateQuantity = async (cartId: number, quantity: number) => {
        let userId: string = localStorage.getItem('userId');
        let token: string = localStorage.getItem('token');
        const res = await fetch(`${URL}/api/v1/user/${userId}/cart/${cartId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({
                quantity,
            }),
        });
        if (res.status === 200) {
            refreshCart();
        } else {
        }
    };

    const addQuantity = async (cartId: number, quantity: number) => {
        updateQuantity(cartId, quantity + 1);
    };

    const subQuantity = async (cartId: number, quantity: number) => {
        if (quantity > 1) {
            updateQuantity(cartId, quantity - 1);
        }
    };
</script>

<div class="cart-container">
    <div class="cart-header">
        <div class="logo">
            <img
                src="images/logo/logosmall2.png"
                alt="logo"
                width="240"
                height="100"
            />
        </div>
        <div class="tit_page"><h1>장바구니</h1></div>
        <button class="deselect" on:click={deleteSelectedCart}
            >선택삭제❌</button
        >
    </div>

    <div class="main">
        <div class="content">
            <table>
                <tr>
                    <th
                        ><p>전체</p>
                        <p>선택</p>
                        <input type="checkbox" /></th
                    >

                    <th>이미지</th>
                    <th>상품정보</th>
                    <th>수량</th>
                    <th>상품금액</th>
                    <th>합계</th>
                    <th>취소버튼</th>
                </tr>
                {#if carts}
                    {#each carts as cart, index}
                        <tr>
                            <td
                                ><input
                                    type="checkbox"
                                    class="s-check"
                                    bind:checked={cartChecked[index]}
                                /></td
                            >
                            <td
                                ><div class="image-box">
                                    <img
                                        src={cart.thumbnail}
                                        alt={index}
                                        height="120px"
                                    />
                                </div></td
                            >
                            <td>
                                <div class="info">
                                    <div class="goods_tit">{cart.name}</div>
                                </div>
                            </td>
                            <td class="quantity">
                                <div class="counter">
                                    <button
                                        class="btn"
                                        on:click={addQuantity(
                                            cart.cartId,
                                            cart.quantity,
                                        )}>+</button
                                    >
                                    <div class="count">{cart.quantity}</div>
                                    <button
                                        class="btn"
                                        on:click={subQuantity(
                                            cart.cartId,
                                            cart.quantity,
                                        )}>-</button
                                    >
                                </div>
                            </td>
                            <td>
                                <div class="price">{priceWithComma[index]}</div>
                            </td>
                            <td>
                                <div class="sum">
                                    {totPriceWithComma[index]}
                                </div>
                            </td>
                            <td>
                                <div
                                    class="delete"
                                    on:click={deleteCart(cart.cartId)}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="red"
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="ico_delete--3rbOSkZl3A"
                                    >
                                        <path
                                            d="M14.278 1.12l.722.72-6.278 6.28L15 14.397l-.722.722L8 8.841 1.722 15.12 1 14.397l6.278-6.278L1 1.841l.722-.722L8 7.397l6.278-6.278z"
                                            fill="#BDC0C6"
                                        /></svg
                                    >
                                </div>
                            </td>
                        </tr>
                    {/each}
                {/if}
            </table>

            <div class="total_price">총 주문금액 : {totPriceSum}원</div>
            <div>
                <button class="check-out" on:click={() => order()}
                    >결제하기</button
                >
            </div>
        </div>
    </div>

    <footer>
        <div class="" />
    </footer>
</div>

<style>
    @font-face {
        font-family: 'ONE-Mobile-POP';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2105_2@1.0/ONE-Mobile-POP.woff')
            format('woff');
        font-weight: normal;
        font-style: normal;
    }

    * {
        text-align: center;
    }

    .tit_page {
        font-family: 'ONE-Mobile-POP';
        margin-bottom: 15px;
    }

    .cart-container {
        margin: 0 auto;
        width: 1024px;
        display: flex;
        flex-direction: column;
    }

    .logo {
        text-align: center;
        border: 0px;
        margin: 20px auto;
        cursor: pointer;
    }

    .logo > img {
        border-top-left-radius: 60%;
        border-top-right-radius: 60%;
    }
    body {
        background: linear-gradient(to bottom right, #e3f0ff, #fafcff);
        height: 110vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .main {
        background-color: #ffffff;
        border-radius: 20px;
        box-shadow: 0px 10px 20px #1687d933;
    }

    .content {
        display: flex;
        flex-direction: column;
    }
    .quantity {
        width: 100px;
        padding: -30px;
    }

    .counter {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .button {
        border: 0px;
        font-size: 20px;
    }
    .btn {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        background-color: #d9d9d9;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 20px;
        font-family: 'Open Sans';
        font-weight: 900;
        color: #202020;
        cursor: pointer;
        border: none;
    }
    /* .count{
	font-size: 20px;
	font-family: 'Open Sans';
	font-weight: 600;
	color: #202020;
    margin: 10px;
} */

    .check-out {
        margin-top: 10px;
        width: 8em;
        height: 40px;
        border: none;
        background: linear-gradient(to bottom right, #b8d7ff, #8eb7eb);
        border-radius: 20px;
        cursor: pointer;
        font-size: 16px;
        font-family: 'Open Sans';
        font-weight: 600;
        color: #202020;
        float: right;
    }

    table {
        border-collapse: collapse;
    }
    td {
        border: 1px solid rgb(252, 211, 211);
        padding: 10px;
    }
    th {
        padding: 10px;
        background-color: lightblue;
    }

    .goods_tit {
        font-weight: bold;
        font-size: 18px;
    }

    .info {
        text-align: center;
    }

    .s-check {
        width: 80px;
    }

    .deselect {
        margin-top: 10px;
        width: 8em;
        height: 40px;
        border: none;
        background: linear-gradient(to bottom right, #f0c7ec, #ffa3b6);
        border-radius: 20px;
        cursor: pointer;
        font-size: 16px;
        font-family: 'Open Sans';
        font-weight: 600;
        color: #202020;
        margin-right: 65em;
    }

    button {
        margin: 10px;
    }

    .total_price {
        font-size: 20px;
        font-weight: bold;
        border: 1px solid #cccc;
        background-color: whitesmoke;
        width: 50vh;
        height: 40px;
        display: flex;
        justify-content: center;
        text-align: center;
    }
</style>
