<script lang="ts">
    export let qna;
</script>

<section class="product-qna" id="qna" bind:this={qna}>
    <div class="tit-box">
        <h2 class="section-tit">상품문의</h2>
        <p class="section-tit-des">
            - 문의 혹은 주문이 많을 경우 답에 다소 시간이 지연될 수 있습니다
        </p>
        <a href="#" class="write-qna-btn">문의하기</a>
    </div>
    <article class="qna-box">
        <div class="user-q">
            <strong class="qna-badge">질문</strong>
            <div class="qna-details">
                <h3 class="qna-info">
                    <b class="user-id">user-id</b>
                    <span class="qna-date">2022.04.15</span>
                </h3>
                <p class="qna-txt">언제오나요?</p>
            </div>
        </div>
        <div class="saller-a">
            <strong class="qna-badge">답변</strong>
            <div class="qna-details">
                <h3 class="qna-info">
                    <b class="saller-name">saller-name</b>
                    <span class="qna-date">2022.04.15</span>
                </h3>
                <p class="qna-txt">
                    주문하신 제품은 주문일 익일 발송되었습니다.<br />
                    배송 상세 정보는 마이페이지에서 확인하실 수 있습니다.<br />
                    감사합니다
                </p>
            </div>
        </div>
    </article>
    <!-- 테스트 -->
    <article class="qna-box">
        <div class="user-q">
            <strong class="qna-badge">질문</strong>
            <div class="qna-details">
                <h3 class="qna-info">
                    <b class="user-id">user-id</b>
                    <span class="qna-date">2022.04.15</span>
                </h3>
                <p class="qna-txt">언제오나요?</p>
            </div>
        </div>
        <div class="saller-a">
            <strong class="qna-badge">답변</strong>
            <div class="qna-details">
                <h3 class="qna-info">
                    <b class="saller-name">saller-name</b>
                    <span class="qna-date">2022.04.15</span>
                </h3>
                <p class="qna-txt">
                    주문하신 제품은 주문일 익일 발송되었습니다.<br />
                    배송 상세 정보는 마이페이지에서 확인하실 수 있습니다.<br />
                    감사합니다
                </p>
            </div>
        </div>
    </article>
    <article class="qna-box">
        <div class="user-q">
            <strong class="qna-badge">질문</strong>
            <div class="qna-details">
                <h3 class="qna-info">
                    <b class="user-id">user-id</b>
                    <span class="qna-date">2022.04.15</span>
                </h3>
                <p class="qna-txt">언제오나요?</p>
            </div>
        </div>

        <div class="saller-a">
            <strong class="qna-badge">답변</strong>
            <div class="qna-details">
                <h3 class="qna-info">
                    <b class="saller-name">saller-name</b>
                    <span class="qna-date">2022.04.15</span>
                </h3>
                <p class="qna-txt">
                    주문하신 제품은 주문일 익일 발송되었습니다.<br />
                    배송 상세 정보는 마이페이지에서 확인하실 수 있습니다.<br />
                    감사합니다
                </p>
            </div>
        </div>
    </article>
    <!-- 테스트 -->
    <div class="pager">
        <div class="btn-grp prev-btn">
            <button>&lt;&lt;</button>
            <button>&lt;</button>
        </div>
        <ul>
            <li><button>1</button></li>
        </ul>
        <div class="btn-grp next-btn">
            <button>&gt;</button>
            <button>&gt;&gt;</button>
        </div>
    </div>
</section>
