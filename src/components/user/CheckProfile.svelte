<script lang="ts">
    export let checked: boolean;
    export let userPw: string;
    import { onMount } from 'svelte';
    import { pop } from 'svelte-spa-router';
    import { URL } from '../../common.ts';

    let userId: string;
    onMount(() => {
        userId = localStorage.getItem('userId');
        if (!userId) {
            alert('로그인 후 이용 가능합니다.');
            return;
        }
    });

    const login = async () => {
        const res = await fetch(`${URL}/api/v1/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                userPw,
            }),
        });
        if (res.status === 200) {
            const token = res.headers.get('Authorization');
            localStorage.setItem('token', token);
            checked = true;
        } else {
            alert('회원정보가 일치하지 않습니다!');
        }
    };
</script>

<div class="mypage_container">
    <div class="member-container">
        <h2 class="mem-check-tit">회원정보 확인</h2>
        <div class="member-logo">
            <img src="./images/logo/logosmall2.png" width="250" height="100" />
        </div>
        <h3>개인정보 조회를 위해 비밀번호를 입력해주세요.</h3>
        <section class="login-input-section-wrap">
            <div class="login-input-wrap">
                <div class="id_icon">
                    <i class="fa fa-user" />
                    <input
                        disabled
                        type="text"
                        placeholder="&nbsp;ID"
                        value="&nbsp;{userId}"
                    />
                </div>
            </div>
            <div class="login-input-wrap password-wrap">
                <div class="pw_icon">
                    <i class="fa fa-lock" />
                    <input
                        type="password"
                        placeholder="&nbsp;Password"
                        bind:value={userPw}
                    />
                </div>
            </div>
            <div class="login-button-wrap">
                <button id="login" on:click={login}>확인</button>
            </div>
            <div class="cancel-button-wrap">
                <button id="cancel" on:click={pop}>취소</button>
            </div>
        </section>
    </div>
</div>

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
        height: 800px;
        align-items: center;
        margin: 10px auto;
    }

    .member-container {
        background-color: white;
        display: flex;
        flex-direction: column;
        width: 800px;
        height: 600px;
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

    .logo-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .login-input-section-wrap {
        padding-top: 30px;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 auto;
    }

    .login-input-wrap {
        width: 465px;
        height: 32px;
        border: solid 1px var(--border-gray-color);
        background: white;
        padding: 3px;
        margin: 3px;
        display: flex;
        justify-content: center;
    }
    .password-wrap {
        margin-top: 13px;
    }
    .login-input-wrap input {
        border: solid 0.2px;
        width: 300px;
        font-size: 20px;

        justify-content: center;
        height: 30px;
    }

    .login-input-section-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .login-button-wrap button {
        border: none;
        font-size: 20px;
        margin-top: 50px;
        background-color: rgb(97, 161, 235);
        color: white;
        border-radius: 60px;
        height: 50px;
        width: 200px;
        font-family: 'yg-jalnan';
    }

    .pw_icon,
    .id_icon {
        font-size: 20px;
        margin-right: 20px;
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

    .member-logo {
        text-align: center;
        align-items: center;
    }
</style>
