import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CourseGateway } from './course.gateway';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AcceptCourseDto } from './dto/accept-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly courseGateway: CourseGateway,
  ) {}

  @UseGuards(RolesGuard)
  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    const course = await this.coursesService.create(dto);
    this.courseGateway.proposeCourse(course);
    return course;
  }

  @Get('mine')
  findMine(@CurrentUser() user: User) {
    return this.coursesService.findMine(user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.DELIVER)
  @Get('mine/deliver-stats')
  getDeliverStats(@CurrentUser() user: User) {
    return this.coursesService.getDeliverStats(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Get('mine/customer-stats')
  getCustomerStats(@CurrentUser() user: User) {
    return this.coursesService.getCustomerStats(user.id);
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.coursesService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @Body() dto: AcceptCourseDto) {
    return this.coursesService.accept(id, dto.delivererId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() user: User) {
    return this.coursesService.confirmByCustomer(id, user.id);
  }

  @Post(':id/refuse')
  refuse(@Param('id') id: string, @CurrentUser() user: User) {
    return this.coursesService.refuse(id, user.id);
  }

  @Post(':id/generate-code')
  generateCode(@Param('id') id: string) {
    return this.coursesService.generateValidationCode(id);
  }

  @Post(':id/validate-code')
  validateCode(@Param('id') id: string, @Body('code') code: string) {
    return this.coursesService.validateCode(id, code);
  }
}
