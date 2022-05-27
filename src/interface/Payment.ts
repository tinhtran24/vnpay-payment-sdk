import { BankCode } from "./BankCode";

export interface ReturnServices{
    message: string;
    success: boolean;
    data?: any;
    status?:number
}

export interface  RequestPayment {
    orderId: string;
    appId: string;
    isApp: boolean;
    amount: number;
    orderType: 'topup' | 'billpayment' | 'fashion'
    bankCode: BankCode
    language: 'vn' | 'en',
    clientHost: string,
    orderInfo: string
}


export interface VNpayOrder {
    vnp_Amount?: number;
    vnp_BankCode?: string;
    vnp_Command?: string;
    vnp_CreateDate?: string;
    vnp_CurrCode?: string;
    vnp_IpAddr?: string;
    vnp_Locale?: string;
    vnp_Merchant?: string;
    vnp_OrderInfo?: string;
    vnp_OrderType?: string;
    vnp_ReturnUrl?: string;
    vnp_TmnCode?: string;
    vnp_TxnRef?: any;
    vnp_SecureHashType?: string;
    vnp_SecureHash?: string;
    vnp_Version?: string;
}