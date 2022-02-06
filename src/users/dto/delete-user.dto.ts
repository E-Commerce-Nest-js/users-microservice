import { IsEmail, IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DeleteUserDto {
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    _id: string;
}
