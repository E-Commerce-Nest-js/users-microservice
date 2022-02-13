import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { UserAddressDto } from './update-user.dto';

export class UserResponseDto {
    @ApiProperty({ type: String })
    _id: string | Types.ObjectId;

    @ApiProperty({ example: 'user@mail.com' })
    email: string;

    @ApiPropertyOptional({ example: 'Firstname' })
    first_name?: string;

    @ApiPropertyOptional({ example: 'Secondname' })
    second_name?: string;

    @ApiPropertyOptional({ example: '1990-01-01' })
    birthday?: string;

    @ApiPropertyOptional({ example: 'http://img-service/useravatar/432423143' })
    avatar_url?: string;

    @ApiPropertyOptional()
    address?: UserAddressDto;

    @ApiProperty({ type: Date })
    createdAt?: string | Date;

    @ApiProperty({ type: Date })
    updatedAt?: string | Date;
}
