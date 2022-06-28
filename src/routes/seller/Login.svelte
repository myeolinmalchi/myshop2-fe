<script lang="ts">
    import { push } from 'svelte-spa-router';
    import { match } from 'ts-pattern';
    import { URL } from '../../store.ts';

    let sellerId: string;
    let sellerPw: string;
    const login = async () => {
        const res = await fetch(`${URL}/api/v1/seller/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sellerId,
                sellerPw,
                name: '',
                email: '',
                phonenumber: '',
            }),
        });

        match(res)
            .with({ status: 200 }, () => {
                const token = res.headers.get('Authorization');
                localStorage.setItem('token', token);
                localStorage.setItem('sellerId', sellerId);
                push('/seller');
            })
            .with({ status: 400 }, () => alert('올바르지 않은 요청입니다.'))
            .with({ status: 401 }, () => alert('비밀번호가 일치하지 않습니다.'))
            .with({ status: 404 }, () => alert('존재하지 않는 계정입니다.'))
            .exhaustive();
    };
</script>

<div class="member_container">
    <div class="wrapper">
        <header class="member-header">
            <div class="member-logo">
                <img
                    src="images/logo/logosmall2.png"
                    width="300"
                    height="120"
                    on:click={() => push('/seller')}
                />
            </div>
        </header>
        <section class="login-input-section-wrap">
            <div class="login-input-wrap">
                <div class="id_icon">
                    <i class="fa fa-user" />
                    <input
                        type="text"
                        placeholder="ID"
                        id="id"
                        class="account"
                        bind:value={sellerId}
                    />
                </div>
            </div>
            <div class="login-input-wrap password-wrap">
                <div class="pw_icon">
                    <i class="fa fa-lock" />
                    <input
                        type="password"
                        placeholder="Password"
                        id="password"
                        class="account"
                        bind:value={sellerPw}
                    />
                </div>
            </div>
            <div class="login-button-wrap">
                <button id="login" class="account" on:click={login}
                    >로그인</button
                >
                <p id="alert" class="account" />
            </div>
            <div class="sign-in-wrap">
                <button on:click={() => push('/regist')}>회원가입</button>
            </div>
        </section>
    </div>
    <footer>
        <div class="copyright-wrap">
            <span>Copyright © My shop Corp. All Rights Reserved.</span>
        </div>
    </footer>
</div>

<style>
    @font-face {
        font-family: 'SDSamliphopangche_Outline';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts-20-12@1.0/SDSamliphopangche_Outline.woff')
            format('woff');
        font-weight: normal;
        font-style: normal;
    }

    .member_container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 21px;
    }

    .wrapper {
        width: 768px;
    }

    .main_container .wrapper {
        width: 96px;
        height: 30px;
        color: var(--font-color);
        border: solid 1px var(--border-gray-color);
    }

    .copyright-wrap {
        font-family: 'SDSamliphopangche_Outline';
    }

    .member-logo {
        margin-top: 80px;
        text-align: center;
    }

    .main-container .main-wrap header {
        display: flex;
        justify-content: flex-end;
    }

    .main-container .main-wrap header .logo-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .login-input-section-wrap {
        padding-top: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .login-input-wrap {
        width: 465px;
        height: 32px;
        border: solid 1px var(--border-gray-color);
        background: white;
    }
    .password-wrap {
        margin-top: 13px;
    }
    .login-input-wrap input {
        border: solid 0.2px;
        width: 380px;
        margin-top: 10px;
        font-size: 14px;
        margin-left: 2.5px;
        height: 30px;
    }

    .login-input-section-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .login-button-wrap button {
        border: none;
        font-weight: border;
        font-size: 20px;
        margin-top: 50px;
        background-color: steelblue;
        color: white;
        border-radius: 2px;
        height: 50px;
        width: 400px;
    }

    .sign-in-wrap button {
        border: none;
        font-weight: border;
        font-size: 20px;
        margin-top: 10px;
        background-color: palegreen;
        color: black;
        border-radius: 2px;
        height: 50px;
        width: 400px;
    }

    .sign-in-kakao button {
        border: none;
        font-weight: border;
        font-size: 20px;
        margin-top: 10px;
        background-color: rgb(242, 255, 0);
        color: black;
        border-radius: 2px;
        height: 50px;
        width: 400px;
    }

    .login-stay-sign-in,
    footer {
        margin-top: 20px;
    }

    .pw_icon,
    .id_icon {
        font-size: 20px;
        margin-left: 20px;
        margin-right: 8px;
    }

    footer {
        padding-top: 95px;
        padding-bottom: 15px;

        display: flex;
        flex-direction: column;
        align-items: center;
        width: 768px;
    }
</style>
