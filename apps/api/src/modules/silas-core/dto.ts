import { IsString } from 'class-validator';

export class RunDemoDto {
  @IsString()
  resourceId!: string;
}
