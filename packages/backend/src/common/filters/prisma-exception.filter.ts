import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { ApiResponse } from '@mawell/shared';

@Catch(PrismaClientKnownRequestError, PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError | PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';
    let error = 'DatabaseError';
    let details: any = null;

    if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2000':
          status = HttpStatus.BAD_REQUEST;
          message = 'The provided value is too long';
          error = 'ValueTooLong';
          break;
        case 'P2001':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          error = 'RecordNotFound';
          break;
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Unique constraint violation';
          error = 'UniqueConstraintViolation';
          details = {
            fields: exception.meta?.target,
          };
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint violation';
          error = 'ForeignKeyConstraintViolation';
          break;
        case 'P2004':
          status = HttpStatus.BAD_REQUEST;
          message = 'Constraint violation';
          error = 'ConstraintViolation';
          break;
        case 'P2005':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid value for field';
          error = 'InvalidFieldValue';
          break;
        case 'P2006':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid value provided';
          error = 'InvalidValue';
          break;
        case 'P2007':
          status = HttpStatus.BAD_REQUEST;
          message = 'Data validation error';
          error = 'DataValidationError';
          break;
        case 'P2008':
          status = HttpStatus.BAD_REQUEST;
          message = 'Failed to parse query';
          error = 'QueryParseError';
          break;
        case 'P2009':
          status = HttpStatus.BAD_REQUEST;
          message = 'Failed to validate query';
          error = 'QueryValidationError';
          break;
        case 'P2010':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Raw query failed';
          error = 'RawQueryError';
          break;
        case 'P2011':
          status = HttpStatus.BAD_REQUEST;
          message = 'Null constraint violation';
          error = 'NullConstraintViolation';
          details = {
            field: exception.meta?.target,
          };
          break;
        case 'P2012':
          status = HttpStatus.BAD_REQUEST;
          message = 'Missing required value';
          error = 'MissingRequiredValue';
          break;
        case 'P2013':
          status = HttpStatus.BAD_REQUEST;
          message = 'Missing required argument';
          error = 'MissingRequiredArgument';
          break;
        case 'P2014':
          status = HttpStatus.BAD_REQUEST;
          message = 'Relation violation';
          error = 'RelationViolation';
          break;
        case 'P2015':
          status = HttpStatus.NOT_FOUND;
          message = 'Related record not found';
          error = 'RelatedRecordNotFound';
          break;
        case 'P2016':
          status = HttpStatus.BAD_REQUEST;
          message = 'Query interpretation error';
          error = 'QueryInterpretationError';
          break;
        case 'P2017':
          status = HttpStatus.BAD_REQUEST;
          message = 'Records not connected';
          error = 'RecordsNotConnected';
          break;
        case 'P2018':
          status = HttpStatus.NOT_FOUND;
          message = 'Required connected records not found';
          error = 'ConnectedRecordsNotFound';
          break;
        case 'P2019':
          status = HttpStatus.BAD_REQUEST;
          message = 'Input error';
          error = 'InputError';
          break;
        case 'P2020':
          status = HttpStatus.BAD_REQUEST;
          message = 'Value out of range';
          error = 'ValueOutOfRange';
          break;
        case 'P2021':
          status = HttpStatus.NOT_FOUND;
          message = 'Table does not exist';
          error = 'TableNotFound';
          break;
        case 'P2022':
          status = HttpStatus.NOT_FOUND;
          message = 'Column does not exist';
          error = 'ColumnNotFound';
          break;
        case 'P2023':
          status = HttpStatus.BAD_REQUEST;
          message = 'Inconsistent column data';
          error = 'InconsistentColumnData';
          break;
        case 'P2024':
          status = HttpStatus.REQUEST_TIMEOUT;
          message = 'Connection timeout';
          error = 'ConnectionTimeout';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found for operation';
          error = 'RecordNotFoundForOperation';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Unknown database error';
          error = 'UnknownDatabaseError';
          details = {
            code: exception.code,
            meta: exception.meta,
          };
      }
    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database validation error';
      error = 'DatabaseValidationError';
      details = {
        validationError: exception.message,
      };
    }

    // Log the error
    const errorLog = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      error,
      message,
      details,
      prismaCode: exception instanceof PrismaClientKnownRequestError ? exception.code : null,
      userId: (request as any).user?.id,
    };

    this.logger.error('Prisma Error:', errorLog);

    // Prepare response
    const apiResponse: ApiResponse = {
      success: false,
      message,
      error,
      ...(details && { details }),
    };

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      apiResponse.message = 'Internal server error';
      apiResponse.error = 'InternalServerError';
      delete apiResponse.details;
    }

    response.status(status).json({
      ...apiResponse,
      timestamp: new Date().toISOString(),
      path: request.url,
      statusCode: status,
    });
  }
}