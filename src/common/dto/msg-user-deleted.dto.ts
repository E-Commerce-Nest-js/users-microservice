import { IsEmail, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class MsgUserDeletedDto {
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    userId: string;
}
