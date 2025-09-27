import Joi from 'joi';

export const createCardSchema = Joi.object({
  type: Joi.string()
    .valid(
      'TRANSLATION',
      'DEFINITION',
      'AUDIO_TEXT',
      'IMAGE_TEXT',
      'FILL_BLANK',
      'MULTIPLE_CHOICE',
      'GRAMMAR',
      'CONVERSATION'
    )
    .optional(),
  front: Joi.string().min(1).max(1000).required(),
  back: Joi.string().min(1).max(1000).required(),
  hint: Joi.string().max(500).optional(),
  options: Joi.array().items(Joi.string().max(200)).optional(), // For multiple choice
  audioUrl: Joi.string().uri().optional(),
  imageUrl: Joi.string().uri().optional(),
  frontLanguageId: Joi.string().min(2).max(5).optional(), // Language ISO code
  backLanguageId: Joi.string().min(2).max(5).optional(), // Language ISO code
  difficulty: Joi.number().integer().min(0).max(5).optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  isShared: Joi.boolean().optional(),
  deckId: Joi.string().optional(), // Optional - cards can exist without decks
});

export const updateCardSchema = Joi.object({
  type: Joi.string()
    .valid(
      'TRANSLATION',
      'DEFINITION',
      'AUDIO_TEXT',
      'IMAGE_TEXT',
      'FILL_BLANK',
      'MULTIPLE_CHOICE',
      'GRAMMAR',
      'CONVERSATION'
    )
    .optional(),
  front: Joi.string().min(1).max(1000).optional(),
  back: Joi.string().min(1).max(1000).optional(),
  hint: Joi.string().max(500).optional(),
  options: Joi.array().items(Joi.string().max(200)).optional(),
  audioUrl: Joi.string().uri().optional(),
  imageUrl: Joi.string().uri().optional(),
  frontLanguageId: Joi.string().min(2).max(5).optional(),
  backLanguageId: Joi.string().min(2).max(5).optional(),
  difficulty: Joi.number().integer().min(0).max(5).optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  isShared: Joi.boolean().optional(),
  isArchived: Joi.boolean().optional(),
});

export const createBulkCardsSchema = Joi.array()
  .items(createCardSchema)
  .min(1)
  .max(100);
