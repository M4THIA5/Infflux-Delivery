import { Controller } from '@nestjs/common';
import { EntrepotsService } from './entrepots.service';

@Controller('entrepots')
export class EntrepotsController {
  constructor(private readonly entrepotsService: EntrepotsService) {}
}
