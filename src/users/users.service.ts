import { Injectable } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { InjectModel } from 'nestjs-typegoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UserModel } from './user.model';

@Injectable()
export class UsersService {
    constructor(@InjectModel(UserModel) private readonly userModel: ModelType<UserModel>) {}

    async createUser(dto: CreateUserDto): Promise<UserModel> {
        const newUser = new this.userModel({
            _id: dto._id,
            email: dto.email,
        });
        return newUser.save();
    }
}
