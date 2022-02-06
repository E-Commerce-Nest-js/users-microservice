import { index, mongoose, prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export interface UserModel extends Base {}

export class UserModel extends TimeStamps {
    @prop({ unique: true })
    email: string;

    @prop()
    first_name?: string;

    @prop()
    second_name?: string;

    @prop()
    birthday?: string;

    @prop()
    avatar_url?: string;

    @prop({ type: () => [UserAddress] })
    address?: UserAddress[];
}

export class UserAddress {
    @prop()
    city: string;

    @prop()
    street: string;

    @prop()
    apartment: string;
}
