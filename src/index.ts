import qs from 'qs';
import sha256 from 'sha256';
import { sortObject } from "./lib/common";
import { errors } from "./lib/systems";
import dayjs from 'dayjs';
import { RequestPayment, ReturnServices, VNpayOrder } from "./interface/Payment";

export interface IPayment {
    CreatePaymentURL(data: RequestPayment, ipAddr : string): Promise<string>;
    CheckReturnUrl(vnp_Params: string, url: string): Promise<ReturnServices>;
}

class VNPayService implements IPayment {
    getConfig() {
        return {
            vnp_TmnCode: process.env.VNP_TMNCODE,
            vnp_HashSecret: process.env.VNP_HASHSECRET,
            vnp_Url: process.env.VNP_URL,
            vnp_ReturnUrl: process.env.VNP_RETURNURL,
        }
    }

    /**
     * @description Create payment URL VNpay
     * @param data
     * @param {String} ipAddr
     * @returns {Promise<{success: boolean, error: null}|{result: null, success: boolean}>}
     */
    async CreatePaymentURL( data: RequestPayment, ipAddr : string): Promise<string> {
        try {
            const config = this.getConfig();
            let currCode = 'VND';
            const createDate =  dayjs().format('HHmmss')
            let vnp_Params: VNpayOrder = {
                vnp_Version : '2',
                vnp_Command: 'pay',
                vnp_Locale: data.language,
                vnp_CurrCode: currCode,
                vnp_TxnRef: `${data.orderId}_${data.appId}_${data.isApp ? 1 : 0}`,
                vnp_Amount: data.amount* 100,
                vnp_OrderType: data.orderType,
                vnp_ReturnUrl: config.vnp_ReturnUrl.replace('{clientHost}', data.clientHost || 'http://localhost'),
                vnp_OrderInfo: data.orderInfo,
                vnp_IpAddr: ipAddr,
                vnp_CreateDate: createDate,
                vnp_TmnCode:config.vnp_TmnCode,

            };
            vnp_Params = sortObject(vnp_Params);
            if (data.bankCode !== null && data.bankCode !== '') {
                vnp_Params['vnp_BankCode'] = data.bankCode;
            }
            vnp_Params = sortObject(vnp_Params);
            vnp_Params['vnp_SecureHash'] = this.secureHash(vnp_Params, config);
            vnp_Params['vnp_SecureHashType'] = 'SHA256';
            return config.vnp_Url + '?' + qs.stringify(vnp_Params, {encode: true});
        } catch (error) {
            throw error;
        }
    }

    /**
     * @description Create payment URL VNpay
     * @param {Object} vnp_Params
     * @param {String} url
     */
    async CheckReturnUrl(vnp_Params, url): Promise<ReturnServices>{
        try {
            const paymentInfo = JSON.parse(vnp_Params['vnp_OrderInfo']);
            const orderIdAppId = vnp_Params['vnp_TxnRef'];
            const [orderId, appId] = orderIdAppId.split('_');
            const config = {}
            const secureHash = vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];
            vnp_Params = sortObject(vnp_Params);
            const checkSum = secureHash(vnp_Params, config);
            if (secureHash !== checkSum) {
                return {
                    success:false,
                    message: "Failed",
                    status: -1,
                };
            } else {
                return {
                    data: paymentInfo,
                    success: true,
                    message: "Success",
                    status: 1,
                }
            }
        } catch (error) {
                return this.ipnDataResponse('99', 'Unknow error');
        }
    }

    mapObjectStatus({ vnp_ResponseCode: code, vnp_Amount }) {
        switch (code) {
            case '00':
                return { code: 'SUCCESS_PAYMENT' };
            case '01':
            case '24':
                return errors.TRANSACTION_CANCELED;
            case '06':
                return errors.WRONG_OTP;
            case '07':
                return errors.TRANSACTION_IS_SUSPICIOUS;
            case '08':
                return errors.BANK_MAINTENANCE;
            case '51':
                return errors.ACCOUNT_IS_NOT_ENOUGH_BALANCE;
            case '65':
                return errors.ACCOUNT_HAS_EXCEEDED_THE_DAILY_LIMIT;
            case '75':
                return errors.CAN_NOT_PAY_ORDER;
            default:
                return errors.CAN_NOT_PAY_ORDER;
        }
    }

    secureHash(vnp_Params, config) {
        let signData = config.vnp_HashSecret + qs.stringify(vnp_Params, { encode: false });
        return sha256(signData);
    }

    ipnDataResponse(RspCode, Message) : ReturnServices{
        return {
            message: Message,
            success: false,
            data: 'Unknow error',
            status: RspCode
        };
    }
}

export {
    VNPayService
}