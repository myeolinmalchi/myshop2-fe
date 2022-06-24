<script lang="ts">
    import { onMount } from 'svelte';
    import { pop } from 'svelte-spa-router';
    import { URL } from '../../store.ts';
    export let state: string;
    export let userPw: string;

    let name: string;

    const userId: string = localStorage.getItem('userId');

    let userInfo: object;

    onMount(async () => {
        const token = localStorage.getItem('token');
        if (token && userId) {
            const res = await fetch(`${URL}/api/v1/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
            });

            if (res.status === 200) {
                userInfo = await res.json();
                name = userInfo.name;
            } else if (res.status === 401) {
                alert('로그인 후 이용 가능합니다.');
                localStorage.clear();
                pop();
            } else {
                alert('개인정보를 불러오지 못했습니다.');
                pop();
            }
        } else {
            alert('로그인 후 이용 가능합니다.');
            pop();
        }
    });

    const update = async () => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (userId && token) {
            const res = await fetch(`${URL}/api/v1/user/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify({
                    ...(userPw && { userPw }),
                    ...(name && { name }),
                }),
            });

            if (res.status === 200) {
                alert('개인정보가 변경되었습니다.');
                pop();
            } else if (res.status === 401) {
                alert('로그인이 필요합니다.');
                localStorage.clear();
                pop();
            } else if (res.status === 400) {
                alert('개인정보를 변경하지 못했습니다.');
                pop();
            } else {
                alert('일시적인 오류가 발생했습니다.');
                pop();
            }
        } else {
            alert('로그인이 필요합니다.');
            pop();
        }
    };

    const setState = () => {
        state = 'orders';
    };
</script>

<svelte:head>
    <link
        rel="stylesheet"
        href="https://use.fontawesome.com/releases/v5.6.3/css/all.css"
        integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/"
        crossorigin="anonymous"
    />
</svelte:head>

{#if userInfo}
    <div class="mypage_container">
        <div class="member-container">
            <h2 class="mem-check-tit">회원정보 관리</h2>
            <div class="tabs">
                <input id="order-check" type="radio" name="tab_item" disabled />
                <label class="tab_item" for="order-check"
                    ><span on:click={setState}>주문조회</span></label
                >
                <input id="profile-info" type="radio" name="tab_item" checked />
                <label class="tab_item" for="profile-info"
                    ><span>회원정보 관리</span></label
                >
                <div class="tab_content" id="profile_content">
                    <form class="mem-form">
                        <div class="Setting-profile">
                            <div class="login_ID">
                                <label for="login_ID" class="input-label"
                                    >아이디</label
                                >
                                <div class="input-disabled">
                                    <span>{userId}</span>
                                </div>
                            </div>
                            <hr />
                            <div class="name-form">
                                <label for="name" class="input-label"
                                    >이름</label
                                >
                                <div class="input-outer">
                                    <input
                                        type="text"
                                        id="name"
                                        class="form_control"
                                        bind:value={name}
                                    />
                                </div>
                            </div>
                            <div class="pw-form">
                                <label for="pw" class="input-label"
                                    >비밀번호</label
                                >
                                <div class="input-outer">
                                    <input
                                        type="password"
                                        id="pw"
                                        class="form_control"
                                        value={userPw}
                                    />
                                </div>
                            </div>
                            <hr />
                            <div class="Email-form">
                                <label for="email" class="input-label"
                                    >이메일</label
                                >
                                <div class="input-disabled">
                                    <span>{userInfo.email}</span>
                                </div>
                            </div>
                            <hr />
                            <div class="phone-form">
                                <label for="phone" class="input-label"
                                    >핸드폰 번호</label
                                >
                                <div class="input-disabled">
                                    <span>{userInfo.phonenumber}</span>
                                </div>
                            </div>
                            <hr />
                        </div>
                    </form>
                </div>
            </div>

            <div class="btn-area">
                <div class="save-btn">
                    <button id="save" on:click={update}>저장하기</button>
                </div>
                <div class="cancel-btn">
                    <button id="cancel" on:click={pop}>취소하기</button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @font-face {
        font-family: 'Happiness-Sans-Regular';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2205@1.0/Happiness-Sans-Regular.woff2')
            format('woff2');
        font-weight: 400;
        font-style: normal;
    }

    @font-face {
        font-family: 'yg-jalnan';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_four@1.2/JalnanOTF00.woff')
            format('woff');
        font-weight: normal;
        font-style: normal;
    }

    @font-face {
        font-family: 'Happiness-Sans-Title';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2205@1.0/Happiness-Sans-Title.woff2')
            format('woff2');
        font-weight: normal;
        font-style: normal;
    }

    @font-face {
        font-family: 'SANJUGotgam';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2112@1.0/SANJUGotgam.woff')
            format('woff');
        font-weight: normal;
        font-style: normal;
    }

    .header {
        width: 100%;
        height: 160px;
        line-height: 160px;
        font-size: 30px;
        background-color: #eee;
        text-align: center;
    }

    .mem-check-tit {
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
        height: 900px;
        margin: 10px auto;
    }

    .member-container > h3 {
        font-size: 18px;
        font-weight: 500;
        line-height: 140%;
        text-align: center;
        margin-top: 30px;
        color: #000;
        font-family: 'Happiness-Sans-Regular';
    }

    .mem-form {
        display: flex;
        flex-direction: column;
    }

    .Setting-profile {
        margin: 35px;
    }

    .input-label {
        font-size: 15px;
        font-family: 'SANJUGotgam';
        margin: 25px 0px 25px 0px;
    }

    .cancel-button-wrap button {
        border: none;
        font-size: 20px;
        margin-top: 25px;
        background-color: rgb(242, 134, 159);
        color: white;
        border-radius: 60px;
        height: 50px;
        width: 200px;
        font-family: 'yg-jalnan';
    }

    .cancel-btn button {
        border: none;
        font-size: 20px;

        background-color: rgb(181, 160, 230);
        color: white;
        margin: 16px;
        height: 50px;
        width: 200px;
        font-family: 'yg-jalnan';
    }

    .save-btn button {
        border: none;
        font-size: 20px;

        background-color: rgb(83, 198, 198);
        color: white;
        margin: 16px;
        height: 50px;
        width: 200px;
        font-family: 'yg-jalnan';
    }

    .btn-area {
        text-align: center;
        margin: 10px auto;
        display: flex;
        flex-direction: row;
    }

    .login_ID,
    .name-form,
    .pw-form,
    .Email-form,
    .phone-form,
    .address-form {
        margin: 15px;
    }

    .input-outer input {
        font-size: 16px;
        width: 245px;
        height: 25px;
        margin: 5px 0 5px 0;
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
    #profile-info:checked ~ #profile_content,
    #order-check:checked ~ #order-check_content {
        display: block;
    }

    /* 선택된 탭 스타일 */
    .tabs input:checked + .tab_item {
        background-color: #333333;
        color: #fff;
    }
</style>
