import { IsEmail, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class MsgUserUpdatedDto {
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    userId: string;

    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: string;
}
