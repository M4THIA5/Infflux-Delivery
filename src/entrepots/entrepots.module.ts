import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entrepot } from './entrepot.entity';
import { EntrepotsService } from './entrepots.service';
import { EntrepotsController } from './entrepots.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entrepot])],
  controllers: [EntrepotsController],
  providers: [EntrepotsService],
  exports: [EntrepotsService],
})
export class EntrepotsModule {}
