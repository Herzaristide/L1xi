import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Prisma errors
  if (error.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'Resource already exists',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details || error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};
