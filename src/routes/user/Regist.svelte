<script lang="ts">
    import { match } from 'ts-pattern';
    import { URL } from '../../store.ts';
    import { push, link } from 'svelte-spa-router';

    let userId: string;
    let userPw: string;
    let name: string;
    let email: string;
    let phonenumber: string;

    let error: Array<HTMLElement> = [];

    function checkId(userId: string) {
        const idPattern = /^[a-z]+[a-z0-9]{5,19}$/;
        if (userId === undefined || userId === '') {
            error[0].innerHTML = '필수 정보입니다.';
            error[0].style.display = 'block';
            return false;
        } else if (!idPattern.test(userId)) {
            error[0].innerHTML =
                '5~19자의 영문 소문자, 숫자만 사용 가능합니다.';
            error[0].style.display = 'block';
            return false;
        } else {
            error[0].style.display = 'none';
            return true;
        }
    }

    function checkPw(userPw: string) {
        let pwPattern = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;
        if (userPw === undefined || userPw === '') {
            error[1].innerHTML = '필수 정보입니다.';
            error[1].style.display = 'block';
            return false;
        } else if (!pwPattern.test(userPw)) {
            error[1].innerHTML = '8~16자의 영문 및 숫자를 사용해 주세요.';
            error[1].style.display = 'block';
            return false;
        } else {
            error[1].style.display = 'none';
            return true;
        }
    }

    function checkName(name: string) {
        var namePattern = /[가-힣]/;
        if (name === undefined || name === '') {
            error[2].innerHTML = '필수 정보입니다.';
            error[2].style.display = 'block';
            return false;
        } else if (!namePattern.test(name)) {
            error[2].innerHTML = '한글만 입력 가능합니다.';
            error[2].style.display = 'block';
            return false;
        } else {
            error[2].style.display = 'none';
            return true;
        }
    }

    function isEmailCorrect(email: string) {
        var emailPattern =
            /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/;

        if (email === '') {
            error[3].style.display = 'none';
            return false;
        } else if (!emailPattern.test(email)) {
            error[3].style.display = 'block';
            return false;
        } else {
            error[3].style.display = 'none';
            return true;
        }
    }

    function checkPhoneNum(phone: string) {
        var isPhoneNum = /\d{3}-\d{3,4}-\d{4}$/;
        if (phone === '') {
            error[4].innerHTML = '필수 정보입니다.';
            error[4].style.display = 'block';
            return false;
        } else if (!isPhoneNum.test(phone)) {
            error[4].innerHTML = '형식에 맞지 않는 번호입니다.';
            error[4].style.display = 'block';
            return false;
        } else {
            error[4].style.display = 'none';
            return true;
        }
    }

    const regist = async () => {
        const validation = {
            userId: checkId(userId),
            userPw: checkPw(userPw),
            name: checkName(name),
            email: isEmailCorrect(email),
            phone: checkPhoneNum(phonenumber),
        };
        if (
            validation.userId &&
            validation.userPw &&
            validation.name &&
            validation.email &&
            validation.phone
        ) {
            const res = await fetch(`${URL}/api/v1/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Data-Type': 'json',
                },
                body: JSON.stringify({
                    userId,
                    userPw,
                    name,
                    email,
                    phonenumber,
                }),
            });
            match(res)
                .with({ status: 201 }, () => {
                    alert('회원가입이 완료되었습니다.');
                    push('/');
                })
                .with({ status: 422 }, async () => {
                    const jsonBody = await res.json();
                    alert(jsonBody.error);
                })
                .with({ status: 400 }, async () => {
                    const jsonBody = await res.json();
                    alert(jsonBody.error);
                })
                .exhaustive();
        }
    };
</script>

<!-- header -->
<div id="header">
    <h1 class="signup_title">회원가입 페이지</h1>
    <a href="/" use:link target="_get" title="Myshop 홈페이지 바로가기"
        ><img src="images/logo/logo_cut.png" id="logo" /></a
    >
</div>

<!-- wrapper -->
<div id="wrapper">
    <!-- content-->
    <div id="content">
        <!-- ID -->
        <div>
            <h3 class="join_title">
                <label for="id">아이디</label>
            </h3>
            <span class="box int_id">
                <input
                    type="text"
                    id="id"
                    class="int"
                    maxlength="20"
                    placeholder="아이디를 입력하세요."
                    bind:value={userId}
                />
                <span class="" />
            </span>
            <span class="error_next_box" bind:this={error[0]} />
        </div>

        <!-- PW1 -->
        <div>
            <h3 class="join_title"><label for="pw1">비밀번호</label></h3>
            <span class="box int_pass">
                <input
                    type="password"
                    id="pw1"
                    class="int"
                    maxlength="20"
                    placeholder="******"
                    bind:value={userPw}
                />
            </span>
            <span class="error_next_box" bind:this={error[1]} />
        </div>

        <!-- NAME -->
        <div>
            <h3 class="join_title"><label for="name">이름</label></h3>
            <span class="box int_name">
                <input
                    type="text"
                    id="name"
                    class="int"
                    maxlength="20"
                    placeholder="이름을 입력하세요."
                    bind:value={name}
                />
            </span>
            <span bind:this={error[2]} class="error_next_box" />
        </div>

        <!-- EMAIL -->
        <div>
            <h3 class="join_title">
                <label for="email">이메일</label>
            </h3>
            <span class="box int_email">
                <input
                    type="text"
                    id="email"
                    class="int"
                    maxlength="100"
                    placeholder="example@gmail.com"
                    bind:value={email}
                />
            </span>
            <span class="error_next_box" bind:this={error[3]}
                >이메일 주소를 다시 확인해주세요.</span
            >
        </div>

        <!-- MOBILE -->
        <div>
            <h3 class="join_title"><label for="phoneNo">휴대전화</label></h3>
            <span class="box int_mobile">
                <input
                    type="tel"
                    id="mobile"
                    class="int"
                    maxlength="16"
                    placeholder="010-XXXX-XXXX"
                    bind:value={phonenumber}
                />
            </span>
            <span class="error_next_box" bind:this={error[4]} />
        </div>

        <!-- JOIN BTN-->
        <div class="btn_area">
            <button type="button" id="btnJoin" on:click={regist}>
                <span>가입하기</span>
            </button>
        </div>
    </div>
    <!-- content-->
</div>

<style>
    @font-face {
        font-family: 'IBMPlexSansKR-Regular';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-07@1.0/IBMPlexSansKR-Regular.woff')
            format('woff');
        font-weight: normal;
        font-style: normal;
    }

    @font-face {
        font-family: 'GmarketSansMedium';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff')
            format('woff');
        font-weight: normal;
        font-style: normal;
    }

    @font-face {
        font-family: 'GangwonEduPowerExtraBoldA';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2201-2@1.0/GangwonEduPowerExtraBoldA.woff')
            format('woff');
        font-weight: normal;
        font-style: normal;
    }

    /* 레이아웃 틀 */
    html {
        height: 100%;
    }

    body {
        margin: 0;
        height: 100%;
        background: #f5f6f7;
        font-family: 'GangwonEduPowerExtraBoldA';
    }
    #logo {
        width: 300px;
        height: 150px;
        cursor: pointer;
        border-radius: 80px;
    }

    #header {
        padding-top: 62px;
        padding-bottom: 20px;
        text-align: center;
    }
    #wrapper {
        position: relative;
        height: 100%;
    }

    #content {
        position: absolute;
        left: 50%;
        transform: translate(-50%);
        width: 460px;
    }

    /* 입력폼 */

    h3 {
        margin: 19px 0 8px;
        font-size: 14px;
        font-weight: 700;
    }

    .box {
        display: block;
        width: 100%;
        height: 51px;
        border: solid 1px #dadada;
        padding: 10px 14px 10px 14px;
        box-sizing: border-box;
        background: #fff;
        position: relative;
    }

    .int {
        display: block;
        position: relative;
        width: 100%;
        height: 29px;
        border: none;
        background: #fff;
        font-size: 15px;
    }

    input {
        font-family: 'IBMPlexSansKR-Regular';
    }

    .gender_box {
        font-family: 'IBMPlexSansKR-Regular';
        font-weight: bold;
    }

    .box.int_id {
        padding-right: 110px;
    }

    .box.int_pass {
        padding-right: 40px;
    }

    .box.int_pass_check {
        padding-right: 40px;
    }

    .pswdImg {
        width: 18px;
        height: 20px;
        display: inline-block;
        position: absolute;
        top: 50%;
        right: 16px;
        margin-top: -10px;
        cursor: pointer;
    }

    #bir_wrap {
        display: table;
        width: 100%;
    }

    #bir_yy {
        display: table-cell;
        width: 147px;
    }

    #bir_mm {
        display: table-cell;
        width: 147px;
        vertical-align: middle;
    }

    #bir_dd {
        display: table-cell;
        width: 147px;
    }

    #bir_mm,
    #bir_dd {
        padding-left: 10px;
    }

    select {
        width: 100%;
        height: 29px;
        font-size: 15px;
        background: #fff
            url(https://static.nid.naver.com/images/join/pc/sel_arr_2x.gif) 100%
            50% no-repeat;
        background-size: 20px 8px;
        -webkit-appearance: none;
        display: inline-block;
        text-align: start;
        border: none;
        cursor: default;
        font-family: 'GmarketSansMedium';
    }

    /* 에러메세지 */

    .error_next_box {
        margin-top: 9px;
        font-size: 12px;
        color: red;
        display: none;
    }

    #alertTxt {
        position: absolute;
        top: 19px;
        right: 38px;
        font-size: 12px;
        color: red;
        display: none;
    }

    /* 버튼 */

    .btn_area {
        margin: 30px 0 91px;
    }

    #btnJoin {
        width: 100%;
        padding: 21px 0 17px;
        border: 0;
        cursor: pointer;
        color: #fff;
        background-color: #1a1fbf;
        font-size: 20px;
        font-weight: 400;
        font-family: Dotum, '돋움', Helvetica, sans-serif;
    }
</style>
