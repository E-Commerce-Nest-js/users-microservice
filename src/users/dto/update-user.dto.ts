import { Type } from 'class-transformer';
import {
    IsArray,
    IsDateString,
    IsEmail,
    IsMongoId,
    IsNotEmpty,
    IsString,
    IsUrl,
    ValidateNested,
} from 'class-validator';

export class UpdateUserDto {
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    _id: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    first_name?: string;

    @IsString()
    second_name?: string;

    @IsDateString({ strict: true, strictSeparator: true })
    @IsString()
    birthday?: string;

    @IsUrl()
    @IsString()
    avatar_url?: string;

    @IsArray()
    @ValidateNested()
    @Type(() => UserAddressDto)
    address?: UserAddressDto[];
}

export class UserAddressDto {
    @IsNotEmpty()
    @IsString()
    index: string;

    @IsNotEmpty()
    @IsString()
    city: string;

    @IsNotEmpty()
    @IsString()
    street: string;

    @IsNotEmpty()
    @IsString()
    apartment: string;
}
