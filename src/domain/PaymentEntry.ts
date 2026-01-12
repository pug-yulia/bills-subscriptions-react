export type PaymentType = 'bill' | 'subscription';

export interface PaymentEntry{
    id:string;
    title:string;
    amount:number;
    currency:string;
    type:PaymentType;
    categoryId:string;
    dueDate:string;
    repeatRule:string;
    note?:string;
    isPaid:boolean;
    createdAt:string;
    updatedAt:string;
}