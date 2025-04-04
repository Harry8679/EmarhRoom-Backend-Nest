import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/user/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  // Register
  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) {
    const userExist = await this.userModel.findOne({ email });
    if (userExist) throw new UnauthorizedException('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    await user.save();

    return this.generateToken(user);
  }

  // Login
  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateToken(user);
  }

  // Generate Token
  generateToken(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
