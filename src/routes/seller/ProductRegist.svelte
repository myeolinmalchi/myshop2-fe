<script lang="ts">
    import { URL } from '../../store.js'
    import { onMount } from 'svelte'
    import { push, pop } from 'svelte-spa-router'


    type Category = {
        code: string,
        name: string,
    }

    let categories: Array<Array<Category>> = [];
    
    onMount(async () => {
        const sellerId = localStorage.getItem("sellerId")
        const token = localStorage.getItem("token")
        if (!token || !sellerId) {
            alert("로그인 후 이용 가능합니다.")
            push("/seller/login")
            return
        }

        product.sellerId = sellerId
        const res = await fetch(`${URL}/api/v1/category/main`)
        const jsonBody = await res.json();
        categories = [
            jsonBody.map((value) => {
                const category: Category = {
                    code: value[0],
                    name: value[1],
                }
                return category;
            })
        ]
    })

    const getChildren = async (code: string) => {
        categories = categories.slice(0, code.length)
        const res = await fetch(`${URL}/api/v1/category/${code}/children`)
        const jsonBody = await res.json();
        if(jsonBody !== null && jsonBody.length !== 0) {
            categories = [
                ...categories,
                jsonBody.map((value) => {
                    const category: Category = {
                        code: value[0],
                        name: value[1],
                    }
                    return category;
                })
            ]
        } else {
            product.categoryCode = selectedCategories[selectedCategories.length-1]
            console.log(product.categoryCode)
        }
    }

    const registProduct = async () => {
        const sellerId = localStorage.getItem("sellerId")
        const token = localStorage.getItem("token")
        if (sellerId && token) {
            const res = await fetch(`${URL}/api/v1/seller/${sellerId}/product`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token
                },
                body: JSON.stringify(product)
            })
            if (res.status === 200) {
                const json = await res.json()
                if (json === true) {
                    alert("상품을 등록했습니다.")
                    push("/seller")
                } else {
                    alert("상품 등록에 실패했습니다.")
                    console.log(json.error)
                }
            } else if (res.status === 401) {
                alert("로그인이 필요합니다.")
                push("/seller/login")
            } else if (res.status === 400) {
                alert("상품 등록에 실패했습니다.")
                console.log(res)
            } else {
                alert("상품 등록에 실패했습니다.")
            }
        } else {
            alert("로그인 후 이용 가능합니다.")
            push("/seller/login")
        }

    }

    type Product = {
        name: string;
        sellerId: string;
        price: number;
        categoryCode: string;
        detailInfo: string;
        thumbnail: string;
        optionList: Array<ProductOption>;
        imageList: Array<ProductImage>;
    };

    type ProductImage = {
        image: string;
        sequence: string;
    };

    type ProductOption = {
        name: string;
        optionSequence: string;
        itemList: Array<ProductOptionItem>;
    };

    type ProductOptionItem = {
        name: string;
        itemSequence: number;
        surcharge: string;
    };

    $: product.optionList = product.optionList;

    const appendOption = () => {
        product.optionList = [
            ...product.optionList,
            {
                name: '',
                optionSequence: 1,
                itemList: [
                    {
                        name: '',
                        itemSequence: '',
                        surcharge: 0,
                    },
                ],
            },
        ];
    };

    const deleteOption = (index: number) => {
        product.optionList = product.optionList.filter(
            (value, i) => i != index,
        );
    };

    const appendItem = (index: number) => {
        const last = product.optionList[index].itemList.length
        product.optionList[index].itemList = [
            ...product.optionList[index].itemList,
            {
                name: '',
                itemSequence: last + 1,
                surcharge: 0,
            },
        ];
    };

    const deleteItem = (optionIndex: number, itemIndex: number) => {
        product.optionList[optionIndex].itemList = product.optionList[
            optionIndex
        ].filter((value, i) => i != itemIndex);
    };

    let product: Product = {
        name: '',
        sellerId: '',
        categoryCode: '',
        detailInfo: '',
        thumbnail: '',
        optionList: [
            {
                name: '',
                optionSequence: 1,
                itemList: [
                    {
                        name: '',
                        itemSequence: 1,
                        surcharge: 0,
                    },
                ],
            },
        ],
        imageList: [],
    };

    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

    const setThumbnail = async (e) => {
        const image = e.target.files[0];
        const imageStr = await getBase64(image);
        product.thumbnail = imageStr;
    };

    const setDetailInfo = async (e) => {
        const image = e.target.files[0];
        const imageStr = await getBase64(image);
        product.detailInfo = imageStr;
    };

    const addImage = async (e) => {
        const image = e.target.files[0];
        const imageStr = await getBase64(image);
        product.imageList = [
            ...product.imageList,
            {
                image: imageStr,
                sequence: product.imageList.length,
            },
        ];
    };

    let selectedCategories: array = [];

    const deleteImage = (index: number) => {
        product.imageList = product.imageList.filter((value, i) => i != index);
    };
</script>

<div class="container">
    <div class="inner">
        <h2 class="page-title">상품 등록하기</h2>
        <div class="form-wrapper">
            <div>
                <fieldset class="product-basic-info">
                    <legend>상품 기본정보</legend>

                    <h3 class="section-title">상품 기본정보 등록</h3>
                    <div class="category">
                        <strong>카테고리</strong>
                        {#each categories as category, index}
                            <select required bind:value={selectedCategories[index]} on:change={() => getChildren(selectedCategories[index])}>
                            <option value="none">===선택===</option>
                            {#each category as option}
                                <option value={option.code}>{option.name}</option>
                            {/each}
                        </select>
                        {/each}
                    </div>

                    <label class="product-name">
                        <strong>상품명</strong>
                        <input
                            bind:value={product.name}
                            type="text"
                            name="product-name"
                            required
                        />
                    </label>
                    <label class="product-price">
                        <strong>상품가격</strong>
                        <input
                            bind:value={product.price}
                            type="number"
                            name="product-price"
                            required
                        />
                    </label>
                </fieldset>

                <fieldset class="product-image">
                    <legend>상품 이미지 등록</legend>

                    <h3 class="section-title">상품 이미지 정보 등록</h3>

                    <div class="thumbnails">
                        <div class="add-thumbnails">
                            <!-- 대표사진 등록하기 -->
                            <label class="add-main-thumbnail">
                                <span>대표사진 업로드</span>
                                <input
                                    type="file"
                                    name="main-thumbnail"
                                    accept=".jpg,.png,.jpeg"
                                    on:change={(e) => setThumbnail(e)}
                                    required
                                />
                            </label>

                            <!-- 상품미리보기 이미지 등록 -->
                            <label class="add-sub-thumbnail">
                                <span>미리보기 사진 업로드</span>
                                <input
                                    type="file"
                                    name="sub-thumbnail"
                                    accept=".jpg,.png,.jpeg"
                                    on:change={(e) => addImage(e)}
                                    multiple
                                />
                            </label>

                            <!-- 상품 상세 이미지 등록 -->
                            <label class="add-detail-image">
                                <span>상품 상세이미지 업로드</span>
                                <input
                                    type="file"
                                    name="detail-image"
                                    accept=".jpg,.png,.jpeg"
                                    on:change={(e) => setDetailInfo(e)}
                                />
                            </label>
                        </div>

                        <div class="image-preview">
                            <!-- 등록한 상세이미지 미리보기 -->
                            <div class="detail-image-preview">
                                <img
                                    src={product.detailInfo}
                                    alt="상세이미지"
                                />
                            </div>

                            <div class="thumbnail-preview">
                                <!-- 등록한 대표이미지 미리보기 -->
                                <div class="main-thumbnail-preview">
                                    <img src={product.thumbnail} alt="썸네일" />
                                </div>

                                <!-- 등록한 상품미리보기 이미지 확인 -->
                                <ul class="sub-thumbnail-preview">
                                    {#each product.imageList as image, index}
                                        <li>
                                            <button
                                                class="delite-image"
                                                on:click={() =>
                                                    deleteImage(index)}
                                                >이미지 지우기</button
                                            >
                                            <img
                                                src={image.image}
                                                alt="상품미리보기"
                                            />
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        </div>
                    </div>
                </fieldset>

                <button class="product-registration-btn" on:click={registProduct}>상품등록</button>

                <fieldset class="product-option">
                    <legend>상품 옵션 등록</legend>

                    <h3 class="section-title">
                        <span>상품 옵션 추가</span>
                        <div class="option-btn-group">
                            <button
                                class="option-add-btn"
                                on:click={appendOption}>옵션추가</button
                            >
                        </div>
                    </h3>

                    <ul class="option-list">
                        {#each product.optionList as option, optionIdx}
                            <li class="option">
                                <label class="option-name">
                                    <span>옵션명</span>
                                    <input
                                        type="text"
                                        bind:value={option.name}
                                    />
                                </label>

                                <button
                                    class="item-add-btn"
                                    on:click={() => appendItem(optionIdx)}
                                    >항목 추가 +</button
                                >

                                {#each option.itemList as item, itemIdx}
                                    <ul class="item-list">
                                        <li class="item">
                                            <label class="item-name">
                                                <span>항목 이름</span>
                                                <input
                                                    type="text"
                                                    bind:value={item.name}
                                                />
                                            </label>

                                            <label class="item-surcharge">
                                                <span>항목 추가금</span>
                                                <input
                                                    type="number"
                                                    bind:value={item.surcharge}
                                                />
                                            </label>
                                        </li>
                                    </ul>
                                {/each}
                            </li>
                        {/each}
                    </ul>
                </fieldset>
            </div>
        </div>
    </div>
</div>

<style>
    .header,
    .footer {
        width: 100%;
        height: 160px;
        line-height: 160px;
        font-size: 30px;
        background-color: #eee;
        text-align: center;
    }

    .container {
        margin: 40px 0;
    }

    .container .page-title {
        margin-bottom: 24px;
        padding: 16px 24px;
        background-color: #eee;
        border-radius: 8px;

        font-size: 24px;
    }

    .container .section-title {
        padding-bottom: 16px;
        margin-bottom: 24px;
        border-bottom: 1px solid #ccc;

        font-size: 18px;
        color: #333;
    }

    .container .form-wrapper input {
        font-size: 16px;
        padding: 4px 8px;
        outline: none;
    }

    .form-wrapper fieldset {
        padding: 32px;
        margin-top: 32px;
        border: 1px solid #ccc;

        border-radius: 8px;
    }

    .form-wrapper fieldset label {
        display: block;
        margin-bottom: 16px;
    }

    .form-wrapper fieldset strong {
        display: inline-block;
        min-width: 100px;
        font-weight: 400;
    }

    .form-wrapper .product-basic-info .category {
        margin-bottom: 16px;
    }

    .category select {
        margin-right: 8px;
        padding: 4px 8px;

        font-size: 16px;
        outline: none;
    }
    .form-wrapper .product-image .thumbnails label {
        cursor: pointer;
    }

    .form-wrapper .product-image .thumbnails label span {
        display: inline-block;
        padding: 8px 16px;
        background-color: #eee;
        border: 1px solid #bbb;

        border-radius: 4px;
    }

    .form-wrapper .product-image .thumbnails label span:hover {
        background-color: var(--acent-color);
    }

    .form-wrapper .product-image .thumbnails input {
        display: none;
    }

    /* ----------------썸네일 추가 input---------------- */
    .thumbnails .add-thumbnails {
        display: flex;
        gap: 16px;
    }
    /* ----------------//썸네일 추가 input---------------- */

    /* ----------------추가한 이미지 미리보기---------------- */
    .thumbnails .image-preview {
        margin-top: 32px;
        display: flex;
        align-items: flex-start;
        gap: 16px;
    }

    .thumbnails .image-preview img {
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 100%;
    }

    .thumbnails .image-preview .main-thumbnail-preview,
    .thumbnails .image-preview .sub-thumbnail-preview li {
        display: flex;
        justify-content: center;
        align-items: center;

        border: 1px solid #ddd;
        padding: 8px;
        box-sizing: border-box;
    }

    .thumbnails .image-preview .detail-image-preview {
        width: 298px;
    }

    .thumbnails .image-preview .thumbnail-preview {
        width: 640px;
    }

    .thumbnail-preview .main-thumbnail-preview {
        width: 300px;
        height: 300px;
        margin: 0 auto;
    }
    .thumbnail-preview .sub-thumbnail-preview {
        margin-top: 16px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        box-sizing: border-box;
    }

    .thumbnail-preview .sub-thumbnail-preview li {
        width: 154px;
        height: 154px;
        border: 1px solid #ddd;

        position: relative;
    }

    .thumbnail-preview .sub-thumbnail-preview li .delite-image {
        width: 20px;
        height: 20px;
        border-radius: 15px;
        border: none;
        background: url(../images/ico_close-btn.png) no-repeat center/12px;
        background-color: #ddd;

        font-size: 0;

        position: absolute;
        top: 6px;
        right: 6px;

        display: none;
    }

    .thumbnail-preview .sub-thumbnail-preview li:hover .delite-image {
        display: block;
    }

    /* ----------------//추가한 이미지 미리보기---------------- */

    /* ------------------------------- */

    .form-wrapper .product-registration-btn {
        display: block;
        margin: 0 auto;
        margin-top: 32px;
        padding: 16px 48px;
        background-color: #eee;
        border: 1px solid #bbb;
        border-radius: 4px;
    }

    .form-wrapper .product-registration-btn:hover {
        background-color: var(--acent-color);
    }

    .product-option .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .product-option .section-title button {
        padding: 4px 24px;
        background-color: #eee;

        border-radius: 4px;
        border: none;

        line-height: 2;
        color: #333;
    }

    .product-option .section-title button:hover {
        background-color: var(--acent-color);
    }

    .option-list label span {
        display: inline-block;
        min-width: 100px;
    }

    .option-list .option {
        padding: 16px 24px;
        border-radius: 8px;
        background-color: #eee;

        position: relative;
    }

    .option-list .option ~ .option {
        margin-top: 16px;
    }

    .option-list .option .option-name {
        border-bottom: 1px solid #aaa;
        padding-bottom: 16px;
        margin-bottom: 24px;
    }

    .option-list .option .item-add-btn {
        padding: 4px 24px;
        background-color: #fff;

        border-radius: 4px;
        border: none;

        line-height: 2;
        color: #333;

        position: absolute;
        top: 16px;
        right: 24px;
    }

    .option-list .option .item-add-btn:hover {
        outline: 2px solid var(--acent-color);
    }

    .option-list .option .item-list .item {
        display: flex;
        gap: 32px;
    }
</style>
