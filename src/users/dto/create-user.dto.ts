import { IsEmail, IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    _id: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;
}
