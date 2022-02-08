import { Injectable } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { InjectModel } from 'nestjs-typegoose';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserModel } from './user.model';

@Injectable()
export class UserService {
    constructor(@InjectModel(UserModel) private readonly userModel: ModelType<UserModel>) {}

    async createUser(dto: CreateUserDto): Promise<UserModel> {
        const newUser = new this.userModel({
            _id: dto._id,
            email: dto.email,
        });
        return newUser.save();
    }

    async updateUserEmailById(id: string, email: string): Promise<UserModel> {
        return this.userModel.findByIdAndUpdate(id, { email }, { new: true }).exec();
    }

    async deleteUser(dto: DeleteUserDto): Promise<UserModel> {
        return this.userModel.findByIdAndDelete(dto._id).exec();
    }

    async getUserById(id: string): Promise<UserModel> {
        return this.userModel.findById(id).exec();
    }

    async getUsers(): Promise<UserModel[]> {
        return this.userModel.find({}).exec();
    }

    async updateUserById(id: string, dto: UpdateUserDto): Promise<UserModel> {
        const userData: UpdateUserDto = {
            address: dto.address,
            avatar_url: dto.avatar_url,
            birthday: dto.birthday,
            first_name: dto.first_name,
            second_name: dto.second_name,
        };
        return this.userModel.findByIdAndUpdate(id, userData, { new: true }).exec();
    }
}
