import Joi from 'joi';

export const createDeckSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  isShared: Joi.boolean().optional(),
});

export const updateDeckSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  isShared: Joi.boolean().optional(),
  isArchived: Joi.boolean().optional(),
});
