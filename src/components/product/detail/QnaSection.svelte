<script lang="ts">
    import { onMount } from 'svelte';
    import { URL } from '../../../store.ts';
    export let productId: number;
    export let qna;

    let qnaWrite: boolean = false;
    let qnas;
    let page;
    let pageCount;
    onMount(async () => {
        const res = await fetch(`${URL}/api/v1/product/${productId}/qnas`);
        const jsonBody = await res.json();
        qnas = jsonBody.qnas.map((qna) => {
            const questionDate = new Date(qna.questionDate);
            const answerDate = new Date(qna.answerDate);
            qna.questionDate = questionDate.toLocaleString();
            qna.answerDate = answerDate?.toLocaleString();
            return qna;
        });
        page = jsonBody.page;
        pageCount = jsonBody.pageCount;
    });

    const setPage = async (page) => {
        const res = await fetch(
            `${URL}/api/v1/product/${productId}/qnas?page=${page}`,
        );
        const jsonBody = await res.json();
        qnas = jsonBody.qnas.map((qna) => {
            const questionDate = new Date(qna.questionDate);
            const answerDate = new Date(qna.answerDate);
            qna.questionDate = questionDate.toLocaleString();
            qna.answerDate = answerDate?.toLocaleString();
            return qna;
        });
        page = jsonBody.page;
        pageCount = jsonBody.pageCount;
    };

    const addPage = () => {
        if (page < pageCount) setPage(page + 1);
    };

    const subPage = () => {
        if (page > 1) setpage(page - 1);
    };

    const qnaPopup = () => {
        const token = localStorage.getItem('token');
        if (token) {
            qnaWrite = true;
        } else {
            alert('로그인 후 이용 가능합니다.');
        }
    };

    let question: string;

    const writeQna = async () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (userId) {
            const res = await fetch(`${URL}/api/v1/user/${userId}/qna`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify({
                    productId: Number(productId),
                    userId,
                    question,
                }),
            });
            if (res.status === 201) {
                alert('문의 작성에 성공했습니다.');
                location.reload();
            } else if (res.status === 401) {
                alert('로그인 후 이용 가능합니다.');
            } else {
                alert('문의 작성에 실패했습니다.');
            }
        } else {
            alert('로그인 후 이용 가능합니다.');
        }
    };
</script>

{#if qnas}
    <section class="product-qna" id="qna" bind:this={qna}>
        <div class="tit-box" on:click={qnaPopup}>
            <h2 class="section-tit">상품문의</h2>
            <p class="section-tit-des">
                - 문의 혹은 주문이 많을 경우 답에 다소 시간이 지연될 수 있습니다
            </p>
            <button class="write-qna-btn" on:click={qnaPopup}>문의하기</button>
        </div>

        {#if qnaWrite}
            <div class="write-qna" id="writeQna">
                <div class="content-box">
                    <button
                        on:click={() => (qnaWrite = false)}
                        class="close-btn">닫기</button
                    >
                    <h2 class="section-tit">문의하기</h2>

                    <div class="form-wrap">
                        <fieldset>
                            <legend>문의하기</legend>

                            <div class="qna-content">
                                <h3 class="qna-tit">문의 내용</h3>
                                <textarea
                                    name="문의내용"
                                    required
                                    placeholder="문의내용을 남겨주세요"
                                    bind:value={question}
                                />
                            </div>
                        </fieldset>

                        <button class="qna-submit" on:click={writeQna}
                            >문의남기기</button
                        >
                    </div>
                </div>
            </div>
        {/if}

        {#each qnas as qna}
            <article class="qna-box">
                <div class="user-q">
                    <strong class="qna-badge">질문</strong>
                    <div class="qna-details">
                        <h3 class="qna-info">
                            <b class="user-id">{qna.userId}</b>
                            <span class="qna-date">{qna.questionDate}</span>
                        </h3>
                        <p class="qna-txt">{qna.question}</p>
                    </div>
                </div>
                {#if qna.answer}
                    <div class="saller-a">
                        <strong class="qna-badge">답변</strong>
                        <div class="qna-details">
                            <h3 class="qna-info">
                                <span class="qna-date">{qna.answerDate}</span>
                            </h3>
                            <p class="qna-txt">
                                {qna.answer}
                            </p>
                        </div>
                    </div>
                {/if}
            </article>
        {/each}
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
