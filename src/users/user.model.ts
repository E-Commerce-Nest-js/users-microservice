import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export class UserAddress {
    @prop()
    index: string;

    @prop()
    city: string;

    @prop()
    street: string;

    @prop()
    apartment: string;
}

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

    @prop({ type: () => UserAddress })
    address?: UserAddress;
}
