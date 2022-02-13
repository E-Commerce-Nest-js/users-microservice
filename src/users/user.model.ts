import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export class UserAddress {
    @ApiProperty({ example: '120012' })
    @prop()
    index: string;

    @ApiProperty({ example: 'Moscow' })
    @prop()
    city: string;

    @ApiProperty({ example: 'Pushkina 1' })
    @prop()
    street: string;

    @ApiProperty({ example: '321' })
    @prop()
    apartment: string;
}

export interface UserModel extends Base {}

export class UserModel extends TimeStamps {
    @ApiProperty({ example: 'user@mail.com', description: 'unique' })
    @prop({ unique: true })
    email: string;

    @ApiPropertyOptional({ example: 'Firstname' })
    @prop()
    first_name?: string;

    @ApiPropertyOptional({ example: 'Secondname' })
    @prop()
    second_name?: string;

    @ApiPropertyOptional({ example: '1990-01-01' })
    @prop()
    birthday?: string;

    @ApiPropertyOptional({ example: 'http://img-service/useravatar/432423143' })
    @prop()
    avatar_url?: string;

    @ApiPropertyOptional()
    @prop({ type: () => UserAddress })
    address?: UserAddress;
}
