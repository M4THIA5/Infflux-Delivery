import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { EntrepotsService } from './entrepots.service';
import { CreateEntrepotDto } from './dto/create-entrepot.dto';
import { UpdateEntrepotDto } from './dto/update-entrepot.dto';

@Controller('entrepots')
export class EntrepotsController {
  constructor(private readonly entrepotsService: EntrepotsService) {}

  @Post()
  create(@Body() dto: CreateEntrepotDto) {
    return this.entrepotsService.create(dto);
  }

  @Get()
  findAll() {
    return this.entrepotsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.entrepotsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEntrepotDto) {
    return this.entrepotsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.entrepotsService.remove(id);
  }
}
