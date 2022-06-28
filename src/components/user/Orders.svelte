<script lang="ts">
    import { onMount } from 'svelte';
    import { pop } from 'svelte-spa-router';
    import { URL } from '../../common.ts';
    export let state: string;

    const setState = () => {
        state = 'profile';
    };

    let orders: Array<any>;

    $: orders = orders?.map((order) => {
        order.products = order.products.map((product) => {
            product.details = product.details
                .map((detail) => detail.name)
                .reduce((a, b) => a + ' / ' + b);
            return product;
        });
        const date = new Date(order.orderDate);
        order.orderDate = date.toLocaleString();
        return order;
    });
    onMount(async () => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (userId && token) {
            const res = await fetch(`${URL}/api/v1/user/${userId}/order`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
            });

            if (res.status === 200) {
                orders = await res.json();
                console.log(orders);
            } else if (res.status === 401) {
                alert('로그인 후 이용 가능합니다');
                localStorage.clear();
                pop();
            } else {
                alert('주문 정보를 불러오지 못했습니다.');
                pop();
            }
        } else {
            alert('로그인 후 이용 가능합니다.');
            pop();
        }
    });
</script>

{#if orders}
    <div class="mypage_container">
        <div class="member-container">
            <h2 class="order-check-tit">주문 조회</h2>
            <div class="tabs">
                <input id="order-check" type="radio" name="tab_item" checked />
                <label class="tab_item" for="order-check"
                    ><span>주문조회</span></label
                >
                <input
                    id="profile-info"
                    type="radio"
                    name="tab_item"
                    disabled
                />
                <label class="tab_item" for="profile-info"
                    ><span on:click={setState}>회원정보 관리</span></label
                >
                <div class="tab_content" id="profile_content">
                    <!-- 회원정보 컨텐츠 부분 -->
                </div>
                <div class="tab_content" id="order-check-content">
                    <div class="order-container">
                        {#each orders as order}
                            <h3 class="order-date">{order.orderDate} 주문</h3>
                            {#each order.products as product}
                                <div class="order-content">
                                    <div class="goods">
                                        <div class="img-box">
                                            <img
                                                src={product.thumbnail}
                                                alt={product.name}
                                                width="120"
                                                height="120"
                                            />
                                        </div>
                                        <div class="info">
                                            <div class="goods_tit">
                                                {product.name}
                                            </div>
                                            <div class="detail">
                                                {product.details}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="delivery_status">
                                        <h3>배송상태</h3>
                                        <div class="delivery-icon">
                                            <i class="fa fa-truck" />
                                        </div>
                                        <div>배송중</div>
                                    </div>
                                </div>
                            {/each}
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @font-face {
        font-family: 'Happiness-Sans-Title';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2205@1.0/Happiness-Sans-Title.woff2')
            format('woff2');
        font-weight: normal;
        font-style: normal;
    }

    .header {
        width: 10%;
        height: 160px;
        line-height: 160px;
        font-size: 30px;
        background-color: #eee;
        text-align: center;
    }

    .order-check-tit {
        text-align: center;
        font-family: 'Happiness-Sans-Title';
        margin: 15px;
    }

    .mypage_container {
        background-color: rgb(219, 239, 255);
        display: flex;
        flex-direction: column;
        border-radius: 15px;
        height: 1000px;
        align-items: center;
        margin: 10px auto;
    }

    .member-container {
        background-color: white;
        display: flex;
        flex-direction: column;
        width: 800px;
        height: 100%;
        margin: 10px auto;
    }

    .tabs {
        margin-top: 50px;
        padding-bottom: 40px;
        background-color: #ffffff;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        width: 700px;
        margin: 0 auto;
    }

    /* 탭 스타일 */
    .tab_item {
        width: calc(100% / 2);
        height: 50px;
        border-bottom: 3px solid #333333;
        background-color: #f8f8f8;
        line-height: 50px;
        font-size: 16px;
        text-align: center;
        color: #333333;
        display: block;
        float: left;
        text-align: center;
        font-weight: bold;
        transition: all 0.2s ease;
    }

    .tab_item:hover {
        opacity: 0.75;
    }

    /* 라디오 버튼 UI삭제*/
    input[name='tab_item'] {
        display: none;
    }

    /* 탭 컨텐츠 스타일 */
    .tab_content {
        display: none;
        padding: 40px 40px 0;
        clear: both;
        overflow: hidden;
    }

    /* 선택 된 탭 콘텐츠를 표시 */
    #all:checked ~ #all_content,
    #order-check:checked ~ #order-check-content,
    #design:checked ~ #design_content {
        display: block;
    }

    /* 선택된 탭 스타일 */
    .tabs input:checked + .tab_item {
        background-color: #333333;
        color: #fff;
    }

    .goods {
        flex-direction: row;
        display: flex;
        align-items: center;
    }

    .img-box {
        margin: 20px;
        display: flex;
    }

    .order-container {
        align-items: center;
    }

    .info {
        flex-direction: row;
        width: 300px;
        align-items: center;
        text-align: center;
    }

    .delivery_status {
        border: 1px solid #cccccccc;
        margin-left: 20px;
        width: 120px;
        text-align: center;
    }

    .order-content {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .delivery-icon {
        font-size: 25px;
    }

    .goods_tit {
        font-weight: bold;
    }

    .detail {
        color: green;
    }
</style>
