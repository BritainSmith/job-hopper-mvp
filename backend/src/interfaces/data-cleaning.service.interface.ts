import { Job as PrismaJob } from '@prisma/client';
import {
  CleanedJobData,
  DataQualityMetrics,
} from '../services/data-cleaning.service';

export interface IDataCleaningService {
  cleanJobData(job: PrismaJob): CleanedJobData;
  getDataQualityMetrics(jobs: PrismaJob[]): Promise<DataQualityMetrics>;
  exportCleanedData(jobs: PrismaJob[]): Promise<CleanedJobData[]>;
}
