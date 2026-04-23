import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Cron } from '@nestjs/schedule';
import { CoursesService } from './courses.service';
import { Course } from './course.entity';

interface AcceptCoursePayload {
  courseId: string;
  delivererId: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class CourseGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly coursesService: CoursesService) {}

  proposeCourse(course: Course): void {
    this.server.emit('course-proposed', { course });
  }

  @SubscribeMessage('accept-course')
  async handleAcceptCourse(
    @MessageBody() payload: AcceptCoursePayload,
  ): Promise<void> {
    const course = await this.coursesService.accept(
      payload.courseId,
      payload.delivererId,
    );
    this.server.emit('course-accepted', {
      courseId: course.id,
      delivererId: course.delivererId,
    });
  }

  @Cron('*/30 * * * * *')
  async handleReproposeUnaccepted(): Promise<void> {
    const pending = await this.coursesService.findPending();
    for (const course of pending) {
      this.server.emit('course-proposed', { course });
    }
  }
}
