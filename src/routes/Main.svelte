<script lang="ts">
    import Header from '../components/Header.svelte';
    import { link } from 'svelte-spa-router';
    import type { Product } from '../common.ts';
    import { URL } from '../common.ts';
    import { onMount } from 'svelte';

    let products: Array<Product> = [];

    onMount(async () => {
        const res = await fetch(`${URL}/api/v1/product/random/8`);
        products = await res.json();
    });
</script>

<Header />

<!-- home-container -->
<div class="home-container">
    <!-- 자동 슬라이더 박스 -->
    <div class="slidebox">
        <input type="radio" name="slide" id="slide01" checked />
        <input type="radio" name="slide" id="slide02" />
        <input type="radio" name="slide" id="slide03" />
        <input type="radio" name="slide" id="slide04" />
        <ul class="slidelist">
            <li class="slideitem">
                <div>
                    <label for="slide04" class="left" />
                    <label for="slide02" class="right" />
                    <a href="/"
                        ><img
                            src="./images/slide01.jpg"
                            width="1024"
                            height="650"
                            alt="01"
                        /></a
                    >
                </div>
            </li>
            <li class="slideitem">
                <div>
                    <label for="slide01" class="left" />
                    <label for="slide03" class="right" />
                    <a href="/"
                        ><img
                            src="./images/slide02.jpg"
                            width="1024"
                            height="650"
                            alt="02"
                        /></a
                    >
                </div>
            </li>
            <li class="slideitem">
                <div>
                    <label for="slide02" class="left" />
                    <label for="slide04" class="right" />
                    <a href="/"
                        ><img
                            src="./images/slide03.png"
                            width="1024"
                            height="650"
                            alt="03"
                        /></a
                    >
                </div>
            </li>
            <li class="slideitem">
                <div>
                    <label for="slide03" class="left" />
                    <label for="slide01" class="right" />
                    <a href="/"
                        ><img
                            src="./images/slide04.jpg"
                            width="1024"
                            height="650"
                            alt="04"
                        /></a
                    >
                </div>
            </li>
        </ul>
        <ul class="paginglist">
            <li>
                <label for="slide01" />
            </li>
            <li>
                <label for="slide02" />
            </li>
            <li>
                <label for="slide03" />
            </li>
            <li>
                <label for="slide04" />
            </li>
        </ul>
    </div>

    <!-- 상품추천 박스 -->

    <div class="recommend_box">
        <!-- 상품추천2 -->
        <article class="recommend-goods">
            <h2 class="tit">
                <i class="fa fa-calendar-check" style="color:purple" /> 이 상품은
                어떠세요?
            </h2>
            <ul class="recommend-list">
                {#each products as product}
                    <li>
                        <a href="/product/detail/{product.productId}" use:link>
                            <dl>
                                <dt class="images">
                                    <img
                                        src={product.thumbnail}
                                        alt={product.name}
                                    />
                                </dt>

                                <dd>
                                    <h3 class="product-name">
                                        {product.name}
                                    </h3>
                                    <strong class="product-price"
                                        >{product.price
                                            .toString()
                                            .replace(
                                                /\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g,
                                                ',',
                                            )}원</strong
                                    >
                                    <p class="rating_star">
                                        <span class="star">
                                            <b
                                                class="rating"
                                                style="width:{product.rating *
                                                    20}%;">{product.rating}</b
                                            >
                                        </span>
                                        <span class="rating-total-count"
                                            >({product.reviewCount})</span
                                        >
                                    </p>
                                </dd>
                            </dl>
                        </a>
                    </li>
                {/each}
            </ul>
        </article>

        <!-- 상품추천2 -->
    </div>

    <!-- 상품추천 박스 -->

    <hr />
    <!-- 푸터 -->
    <footer>
        <div class="row">
            <div class="footer-itembox">
                <div class="f-tit">전화문의</div>
                <p class="txt">10시~17시</p>
                <p class="num">0626-xxxx</p>
            </div>
            <div class="footer-itembox">
                <div class="f-tit">카톡문의</div>
                <p class="txt">10시~17시</p>
                <a href="/"
                    ><button class="kakao-btn"
                        ><img
                            src="./images/kakao-icon.png"
                            width="15"
                            height="13"
                            alt="카톡문의"
                        /> 카톡문의</button
                    ></a
                >
            </div>
            <div class="footer-itembox">
                <div class="f-tit">입점문의</div>
                <p class="txt">sunny100487@naver.com</p>
                <a href=""><button class="enter-store">입점 신청하기</button></a
                >
            </div>
        </div>
        <div class="lg-line" />
        <div class="row">
            <div class="info">
                <div class="sns-icon">
                    <div class="s-icon"><i class="fa fa-instagram" /></div>
                    <div class="s-icon"><i class="fa fa-facebook" /></div>
                    <div class="s-icon"><i class="fa fa-twitter" /></div>
                    <div class="s-icon"><i class="fa fa-youtube" /></div>
                </div>
                <div class="copyright-wrap">
                    <div>Copyright © My shop Corp. All Rights Reserved.</div>
                </div>
            </div>
        </div>
    </footer>
</div>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    ul,
    li {
        list-style: none;
    }

    /*--- 헤더 ----*/

    .header {
        display: flex;
        flex-direction: column;
        margin-top: 20px;
    }

    .header-container {
        margin: 0 auto;
        width: 1024px;
    }

    .logo {
        margin-to: 10px;
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
    }

    .search > input {
        font-size: 16px;
        border: solid #cccccc 1px;
        padding: 9px;
        border: 0px;
        float: left;
    }

    /* 검색창 버튼 */
    button {
        margin-left: 15px;
        width: 50px;
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
        height: 0%;
        overflow: hidden;
        transition: all 0.5s;

        /* 하단 content가 밀리지 않기 위해서는 position:absolut속성이 필요합니다. */
        position: absolute;
        left: 0;
        top: 49px;
    }

    nav > ul.menu-hedaer > li:hover .submenu {
        padding: 14px 0;
        height: 210px;
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

    /*--- 헤더 ----*/

    /* --- 자동 슬라이더 박스 --- */

    [name='slide'] {
        display: none;
    }

    .slidebox {
        max-width: 1024px;
        width: 100%;
        margin: 0 auto;
        text-align: center;
        display: flex;
        margin-top: 10px;
        align-items: center;
        flex-direction: column;
    }

    .slidelist {
        width: 100%;
        border-radius: 3px;
    }

    .slidebox img {
        max-width: 100%;
    }

    .slidebox .slidelist {
        white-space: nowrap;
        font-size: 0;
        overflow: hidden;
    }

    .slidebox .slideitem {
        position: relative;
        display: inline-block;
        vertical-align: middle;
        width: 100%;
        transition: all 0.35s;
    }

    .slidebox .slideitem label {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        padding: 20px;
        border-radius: 50%;
        cursor: pointer;
    }

    label.left {
        left: 20px;
        background-image: url('/images/left-arrow.png');
        background-position: center center;
        background-size: 65%;
        background-repeat: no-repeat;
    }

    label.right {
        right: 20px;
        background-image: url('/images/right-arrow.png');
        background-position: center center;
        background-size: 65%;
        background-repeat: no-repeat;
    }

    /* 페이징 스타일 */
    .paginglist {
        text-align: center;
        padding: 30px 0;
    }

    .paginglist > li {
        display: inline-block;
        vertical-align: middle;
        margin: 0 10px;
    }

    .paginglist > li > label {
        display: block;
        padding: 10px 30px;
        border-radius: 10px;
        background: #ccc;
        cursor: pointer;
    }

    .paginglist > li:hover > label {
        background: #333;
    }

    [id='slide01']:checked ~ .slidelist .slideitem {
        transform: translateX(0);
        animation: slide01 20s infinite;
    }

    [id='slide02']:checked ~ .slidelist .slideitem {
        transform: translateX(-100%);
        animation: slide02 20s infinite;
    }

    [id='slide03']:checked ~ .slidelist .slideitem {
        transform: translateX(-200%);
        animation: slide03 20s infinite;
    }

    [id='slide04']:checked ~ .slidelist .slideitem {
        transform: translateX(-300%);
        animation: slide04 20s infinite;
    }

    /* 슬라이더 애니메이션 부분 */
    @keyframes slide01 {
        0% {
            left: 0%;
        }
        23% {
            left: 0%;
        }
        25% {
            left: -100%;
        }
        48% {
            left: -100%;
        }
        50% {
            left: -200%;
        }
        73% {
            left: -200%;
        }
        75% {
            left: -300%;
        }
        98% {
            left: -300%;
        }
        100% {
            left: 0%;
        }
    }
    @keyframes slide02 {
        0% {
            left: 0%;
        }
        23% {
            left: 0%;
        }
        25% {
            left: -100%;
        }
        48% {
            left: -100%;
        }
        50% {
            left: -200%;
        }
        73% {
            left: -200%;
        }
        75% {
            left: 100%;
        }
        98% {
            left: 100%;
        }
        100% {
            left: 0%;
        }
    }
    @keyframes slide03 {
        0% {
            left: 0%;
        }
        23% {
            left: 0%;
        }
        25% {
            left: -100%;
        }
        48% {
            left: -100%;
        }
        50% {
            left: 200%;
        }
        73% {
            left: 200%;
        }
        75% {
            left: 100%;
        }
        98% {
            left: 100%;
        }
        100% {
            left: 0%;
        }
    }
    @keyframes slide04 {
        0% {
            left: 0%;
        }
        23% {
            left: 0%;
        }
        25% {
            left: 300%;
        }
        48% {
            left: 300%;
        }
        50% {
            left: 200%;
        }
        73% {
            left: 200%;
        }
        75% {
            left: 100%;
        }
        98% {
            left: 100%;
        }
        100% {
            left: 0%;
        }
    }

    /* --- 자동 슬라이더 박스 --- */

    /* 홈 컨테이너 */
    .home-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    /*--- 상품 리스트 추천 ---*/

    .recommend-goods {
        width: 100%;
    }
    .recommend-goods .recommend-list {
        margin-top: 40px;
    }

    .recommend-list {
        width: 100%;
        justify-content: center;
        display: flex;
        gap: 32px 24px;
        flex-wrap: wrap;
    }

    .recommend-list li {
        width: 231px;
    }

    .recommend-list li a {
        width: 100%;
        color: #333;
    }

    .recommend-list li a dl {
        width: 100%;
    }

    .recommend-list li a dl dt img {
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 100%;
    }

    .recommend-list li a dl dd {
        margin-top: 16px;
    }

    .recommend-list li a dl dd .product-name {
        margin-bottom: 8px;
    }
    .recommend-list li a dl dd .product-price {
        color: var(--price-color);
    }

    .recommend-list li a dl dd .rating_star {
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
        background: url(/images/ico_star-grey.png) repeat-x left center;
        background-size: auto 100%;
        margin-right: 8px;
    }

    .rating_star .star .rating {
        width: 0;
        background: url(/images/ico_star-yellow.png) repeat-x left center;
        background-size: auto 100%;
        font-size: 0;
    }

    .rating_star .rating-total-count {
        font-weight: bold;
        font-size: 16px;
        line-height: 1;

        /* margin-left: 8px; */

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

    .tit {
        text-align: left;
        margin-left: 3.8em;
    }

    .recommend_box {
        width: 1200px;
        height: 100%;
        margin: 0 auto;
        align-items: center;
    }

    .rating-total-count {
        color: gray;
        margin-right: 3em;
    }

    .recommend-goods {
        margin-bottom: 5em;
        height: 100%;
    }

    footer {
        width: 100%;
        height: 250px;
        align-items: center;
    }

    hr {
        margin-top: 16px;
        margin-bottom: 16px;
        border: 0;
        border-top: 1px solid #eee;
    }

    .images {
        display: flex;
        width: 100%;
        height: 280px;
        text-align: center;
    }

    .images:hover {
        transform: scale(1.08);
        transition: 0.5s; /* 부드럽게 */
    }

    /*--- 상품 리스트 추천 ---*/

    /*--- footer ---*/

    footer {
        margin: 0 auto;
        justify-content: center;
    }

    .footer-itembox {
        width: 300px;
        display: flex;
        flex-direction: column;
        margin-right: 4em;
        align-items: center;
    }

    .f-tit {
        font-weight: bold;
        font-size: 18px;
    }

    .txt {
        margin: 5px;
    }
    .num {
        font-weight: bold;
    }

    .kakao-btn {
        pointer-events: auto;
        background-color: yellow;
        border-radius: 3px;
        height: 32px;
        color: black;
        width: 100px;
        margin: 0 auto;
        text-align: center;
    }

    .info {
        display: flex;
        flex-direction: column;
        text-align: center;
        align-items: center;
        margin-right: 65px;
        justify-content: center;
        margin-top: 15px;
    }

    .copyright-wrap {
        margin: 0 auto;
        align-items: center;
        flex-direction: column;
    }

    .enter-store {
        background-color: white;
        border-radius: 3px;
        border: solid #cccccc 1px;
        color: black;
        width: 100px;
        height: 25px;
        margin: 0 auto;
        text-align: center;
    }

    .enter-store:hover {
        background-color: #eee;
        color: black;
    }

    .sns-icon {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 10px;
        font-size: 25px;
    }

    .lg-line {
        width: 100%;
        margin-top: 16px;
        margin-bottom: 16px;
        border: 0;
        border-top: 1px solid #eee;
    }

    .row {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .sale-percent {
        font-weight: bolder;
        color: green;
    }

    .original-price {
        color: rgb(153, 153, 153);
        font-size: 14px;
        font-weight: 400;
        line-height: normal;
        text-decoration: line-through;
        margin-top: 2px;
    }

    /*--- footer ---*/
</style>
