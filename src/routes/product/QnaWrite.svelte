<script lang="ts">
    import Header from "../../components/Header.svelte";
</script>

<main>
    <button onclick="more()" class="open-btn">문의작성</button>
    <div class="write-qna" id="writeQna">
        <div class="content-box">
            <button onclick="closeLayer()" class="close-btn">닫기</button>
            <h2 class="section-tit">문의하기</h2>

            <div class="form-wrap">
                <form action="#" method="post">
                    <fieldset>
                        <legend>문의하기</legend>

                        <div class="qna-product">
                            <div class="qna-content">
                                <h3 class="qna-tit">문의 내용</h3>
                                <textarea
                                    name="문의내용"
                                    required
                                    placeholder="문의내용을 남겨주세요"
                                />
                            </div>
                        </div>
                    </fieldset>

                    <input type="submit" value="문의남기기" />
                </form>
            </div>
        </div>
    </div>
</main>

<style global>
    * {
        padding: 0;
        margin: 0;
    }
    button {
        cursor: pointer;
    }

    .open-btn {
        margin: 50px;
        font-size: 3rem;
    }

    .write-qna {
        width: 100%;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.6);

        position: fixed;
        top: 0;
        left: 0;
        z-index: 999999;

        display: flex;
        justify-content: center;
        align-items: center;

        display: none;
    }

    .write-qna .content-box {
        width: 400px;
        padding: 32px;
        border-radius: 24px;

        background-color: #fff;
        border: 2px solid #ddd;

        position: relative;
    }

    .write-qna button:active,
    input[type="submit"]:active,
    .write-qna .close-btn:hover {
        outline: 2px solid lightblue;
    }

    .write-qna .close-btn {
        position: absolute;

        width: 32px;
        height: 32px;
        border: 0;
        font-size: 0;

        top: 40px;
        right: 40px;
        background: transparent url(../img/ico_close-btn.png) no-repeat center;
    }

    .write-qna .section-tit {
        margin-bottom: 32px;
        padding: 8px 0;
        border-radius: 8px;
        background-color: #eee;

        text-align: center;
    }

    .write-qna .form-wrap fieldset {
        border: none;
    }

    .write-qna .form-wrap fieldset > div ~ div {
        margin-top: 32px;
    }

    .write-qna .form-wrap .qna-tit {
        font-size: 1.2rem;
        color: #333;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #ddd;
    }

    .write-qna .form-wrap legend {
        font-size: 0;
    }
    .write-qna .qna-product {
    }

    .write-qna .product_option-box .option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
    }
    .write-qna .product_option-box .option ~ .option {
        margin-top: 16px;
    }

    .write-qna .option select {
        -moz-appearance: none;
        -webkit-appearance: none;
        appearance: none;

        flex-grow: 1;
        padding: 12px;
        border-radius: 4px;
        outline: none;
    }
    .write-qna .option select:focus {
        border: 1px solid var(--acent-color);
        outline: 1px solid var(--acent-color);
    }

    .write-qna .qna-content textarea {
        width: 100%;
        min-height: 200px;
        padding: 16px 16px;
        box-sizing: border-box;
    }

    .write-qna .qna-content textarea:focus {
        outline: none;
    }

    .write-qna input[type="submit"] {
        display: block;
        width: 120px;
        line-height: 48px;
        margin: 48px auto 0;
        border: none;
        border-radius: 4px;
        background-color: #ddd;

        font-weight: bold;
        font-size: 1rem;
        letter-spacing: -0.6px;
    }

    .write-qna input[type="submit"]:hover {
        background-color: var(--acent-color);
        color: #fff;
    }
</style>
