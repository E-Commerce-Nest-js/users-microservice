import { Injectable } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { InjectModel } from 'nestjs-typegoose';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

    async updateUser(dto: UpdateUserDto): Promise<UserModel> {
        return this.userModel.findByIdAndUpdate(dto._id, dto, { new: true }).exec();
    }

    async deleteUser(dto: DeleteUserDto): Promise<UserModel> {
        return this.userModel.findByIdAndDelete(dto._id).exec();
    }

    async getUserById(id: string): Promise<UserModel> {
        return this.userModel.findById(id).exec();
    }
}
