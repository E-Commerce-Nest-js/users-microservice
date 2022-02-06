import { Type } from 'class-transformer';
import {
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    ValidateNested,
} from 'class-validator';

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

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    second_name?: string;

    @IsOptional()
    @IsDateString(
        { strict: true, strictSeparator: true },
        { message: 'birthday must be a valid YYYY-MM-DD date string' },
    )
    @IsString()
    birthday?: string;

    @IsOptional()
    @IsUrl()
    @IsString()
    avatar_url?: string;

    @IsOptional()
    @ValidateNested({
        message:
            'nested property address must be object with fields: {index, city, street, apartment}',
    })
    @Type(() => UserAddressDto)
    address?: UserAddressDto;
}
