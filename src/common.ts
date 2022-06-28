//export const URL = 'http://localhost:9000';
export const URL = 'http://49.50.174.103:9000';

export type Category = {
    code: string;
    name: string;
    children: Array<Category>;
};

export type Product = {
    name: string;
    sellerId: string;
    price: number;
    categoryCode: string;
    detailInfo: string;
    thumbnail: string;
    optionList: Array<ProductOption>;
    imageList: Array<ProductImage>;
};

export type ProductImage = {
    image: string;
    sequence: string;
};

export type ProductOption = {
    name: string;
    optionSequence: string;
    itemList: Array<ProductOptionItem>;
};

export type ProductOptionItem = {
    name: string;
    itemSequence: number;
    surcharge: string;
};
