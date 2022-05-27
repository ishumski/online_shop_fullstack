import {HttpException, HttpStatus, Injectable, UnauthorizedException} from '@nestjs/common';
import {UserService} from "../user/user.service";
import {CreateUserDto} from "../user/dto/create.user.dto";
import * as bcrypt from 'bcryptjs'
import {JwtService} from "@nestjs/jwt";
import {User} from "../user/user.model";

@Injectable()
export class AuthService {

    constructor(private userService: UserService, private jwtService: JwtService ) {}

    async login(userDto: CreateUserDto){
        const user = await this.validateUser(userDto)
        return this.generateToken(user)
    }

    async registration(userDto: CreateUserDto){
        const candidate = await this.userService.getUserByEmail(userDto.email)
        if(candidate){
            throw new HttpException('User has already registered', HttpStatus.BAD_REQUEST)
        }

        const hashedPassword = await bcrypt.hash(userDto.password, 5)
        const user = await this.userService.createUser({...userDto, password: hashedPassword})
        return this.generateToken(user)
    }

    private async generateToken(user: User){
        const payload = {email: user.email, id: user.id, role: user.role}
        return {
            token: this.jwtService.sign(payload)
        }
    }

    private async validateUser(userDto){
        const user = await this.userService.getUserByEmail(userDto.email)
        const password = await bcrypt.compare(userDto.password, user.password)

        if(user && password){
            return user
        }

        throw new UnauthorizedException({ message: 'Invalid user email or password'})
    }
}
