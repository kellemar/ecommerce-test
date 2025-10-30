import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '../../entities';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
