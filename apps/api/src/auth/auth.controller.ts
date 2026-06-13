import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterSchema, LoginSchema } from '@drivewise/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: unknown) {
    const dto = RegisterSchema.parse(body);
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() body: unknown) {
    const dto = LoginSchema.parse(body);
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  me(@Request() req: { user: { userId: string } }) {
    return this.authService.me(req.user.userId);
  }
}
