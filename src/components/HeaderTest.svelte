<script>
</script>

<main>
    <div class="top">
        <div class="container">
            <ul class="top-menu">
                <li class="sometimes"><a href="#"><p>즐겨찾기</p></a></li>
                <li class="test"><a href="#"><p>회원가입</p></a></li>
                <li class="test"><a href="#"><p>로그인</p></a></li>
            </ul>
            <heaer>
                <div class="logo">
                    <img
                        src="images/logo/logosmall2.png"
                        alt="logo"
                        width="250"
                        height="100"
                    />
                </div>
                <div class="search">
                    <input type="text" placeholder="검색어 입력" />
                    <button>검색</button>
                </div>
                <div class="icon">
                    <div class="Mypage">
                        <a href="#"><i class="fa fa-user">Mypage</i></a>
                    </div>
                    <div class="cart">
                        <a href="#"><i class="fa fa-shopping-cart">Cart</i></a>
                    </div>
                </div>
            </heaer>
            <div class="category-bar">
                <ul class="menu">
                    <li>
                        <a href="#">패션의류/잡화</a>
                        <ul class="submenu">
                            <li><a href="#">submenu01</a></li>
                            <li><a href="#">submenu02</a></li>
                            <li><a href="#">submenu03</a></li>
                            <li><a href="#">submenu04</a></li>
                            <li><a href="#">submenu05</a></li>
                        </ul>
                    </li>
                    <li>
                        <a href="#">뷰티</a>
                        <ul class="submenu">
                            <li><a href="#">submenu01</a></li>
                            <li><a href="#">submenu02</a></li>
                            <li><a href="#">submenu03</a></li>
                            <li><a href="#">submenu04</a></li>
                            <li><a href="#">submenu05</a></li>
                        </ul>
                    </li>
                    <li>
                        <a href="#">식품</a>
                        <ul class="submenu">
                            <li><a href="#">submenu01</a></li>
                            <li><a href="#">submenu02</a></li>
                            <li><a href="#">submenu03</a></li>
                            <li><a href="#">submenu04</a></li>
                            <li><a href="#">submenu05</a></li>
                        </ul>
                    </li>
                    <li>
                        <a href="#">전자기기</a>
                        <ul class="submenu">
                            <li><a href="#">submenu01</a></li>
                            <li><a href="#">submenu02</a></li>
                            <li><a href="#">submenu03</a></li>
                            <li><a href="#">submenu04</a></li>
                            <li><a href="#">submenu05</a></li>
                        </ul>
                    </li>
                    <li>
                        <a href="#">주방용품</a>
                        <ul class="submenu">
                            <li><a href="#">submenu01</a></li>
                            <li><a href="#">submenu02</a></li>
                            <li><a href="#">submenu03</a></li>
                            <li><a href="#">submenu04</a></li>
                            <li><a href="#">submenu05</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</main>

<style global>
    @import "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css";
    .container {
        margin: 0 auto;
        width: 1024px;
    }
    .top-menu .sometimes:hover p {
        color: darkgray;
    }

    .sometimes,
    .test {
        margin-top: -15px;
    }

    .top {
        background-color: ghostwhite;

        left: 0;
        padding: 0;
        width: 100%;
        height: 20px;
        padding-top: 7px;
        display: flex;
        flex-direction: row;
        justify-content: center;
    }
    .top p {
        font-size: 12px;
        line-height: 20px;
    }
    .top p:hover {
        color: #a8a8a8;
    }
    .top-menu {
        display: inline;
    }
    .top-menu li {
        display: inline-block;
    }
    .top-menu .sometimes a p {
        color: black;
    }

    .top-menu .test {
        float: right;
        padding-right: 20px;
    }
    .top-menu .test a p {
        float: right;
        color: black;
    }
    .top-menu .test:hover p {
        color: darkgray;
    }

    .search {
        height: 40px;
        width: 400px;
        border: 1px solid #1b5ac2;
        background: #ffffff;
        margin-top: -4em;
        margin-left: 19em;
        cursor: auto;
    }
    .search > input {
        font-size: 16px;
        width: 325px;
        padding: 10px;
        border: 0px;
        outline: none;
        float: left;
    }
    button {
        width: 50px;
        height: 100%;
        border: 0px;
        background: #1b5ac2;
        outline: none;
        float: right;
        color: #ffffff;
    }

    .icon {
        font-size: 28px;

        float: right;
        margin-right: 20px;

        display: flex;
        justify-content: column;
        text-decoration: none;
        margin-top: -1.5em;
    }

    .icon a {
        color: navy;
    }

    .Mypage {
        margin-left: 8em;
    }

    .cart {
        margin-left: 25px;
    }

    .fa:hover {
        color: red;
        transition: 0.8s;
        cursor: pointer;
    }

    .menu {
        width: 970px;
        overflow: hidden;
        padding: 8px;
        margin: 35px;
        list-style: none;
        display: flex;
        flex-direction: row;
    }

    .menu > li {
        width: 20%; /*20*5=100%*/
        float: left;

        background-color: #5778ff;
        width: 100%;
        text-align: center;
        padding-left: 15px;
        line-height: 40px;
        background-color: #5778ff;
        text-decoration: none;
    }

    .menu a {
        color: #fff;
        font-weight: bold;
        text-decoration-line: none;
    }

    .submenu > li {
        line-height: 50px;
        background-color: #94a9ff;
    }

    .submenu {
        height: 0; /*ul의 높이를 안보이게 처리*/
        overflow: hidden;
    }

    .menu > li:hover {
        background-color: #94a9ff;
        transition-duration: 0.5s;
    }
    .menu > li:hover .submenu {
        height: 250px; /*서브메뉴 li한개의 높이 50*5*/
        transition-duration: 1s;
    }
</style>
