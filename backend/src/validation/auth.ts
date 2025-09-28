import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  nativeLanguageId: Joi.string().min(2).max(5).required(), // Language ISO code
  learningLanguageId: Joi.string().min(2).max(5).required(), // Language ISO code
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  nativeLanguageId: Joi.string().min(2).max(5).optional(),
  learningLanguageId: Joi.string().min(2).max(5).optional(),
  subscriptionStatus: Joi.string()
    .valid(
      'FREE',
      'PREMIUM',
      'PRO',
      'ENTERPRISE',
      'TRIAL',
      'EXPIRED',
      'SUSPENDED'
    )
    .optional(),
});
