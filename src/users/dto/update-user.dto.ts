import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
    @ApiProperty({ example: '120012' })
    @IsNotEmpty()
    @IsString()
    index: string;

    @ApiProperty({ example: 'Moscow' })
    @IsNotEmpty()
    @IsString()
    city: string;

    @ApiProperty({ example: 'Pushkina 1' })
    @IsNotEmpty()
    @IsString()
    street: string;

    @ApiProperty({ example: '321' })
    @IsNotEmpty()
    @IsString()
    apartment: string;
}

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'Firstname' })
    @IsOptional()
    @IsString()
    first_name?: string;

    @ApiPropertyOptional({ example: 'Secondname' })
    @IsOptional()
    @IsString()
    second_name?: string;

    @ApiPropertyOptional({ example: '1990-01-01' })
    @IsOptional()
    @IsDateString(
        { strict: true, strictSeparator: true },
        { message: 'birthday must be a valid YYYY-MM-DD date string' },
    )
    @IsString()
    birthday?: string;

    @ApiPropertyOptional({ example: 'http://img-service/useravatar/432423143' })
    @IsOptional()
    @IsUrl()
    @IsString()
    avatar_url?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested({
        message:
            'nested property address must be object with fields: {index, city, street, apartment}',
    })
    @Type(() => UserAddressDto)
    address?: UserAddressDto;
}
