import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import gtts from 'gtts';
import { Readable } from 'stream';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Ensure temp directory exists
const tempDir = join(process.cwd(), 'temp');
if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}

// Language mapping for gTTS (ISO language codes to gTTS supported languages)
const languageMapping: Record<string, string> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pt: 'pt',
  ru: 'ru',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh',
  ar: 'ar',
  hi: 'hi',
  nl: 'nl',
  sv: 'sv',
  da: 'da',
  no: 'no',
  fi: 'fi',
  pl: 'pl',
  tr: 'tr',
  cs: 'cs',
  hu: 'hu',
  ro: 'ro',
  sk: 'sk',
  uk: 'uk',
  bg: 'bg',
  hr: 'hr',
  et: 'et',
  lv: 'lv',
  lt: 'lt',
  sl: 'sl',
  mt: 'mt',
  ga: 'ga',
  cy: 'cy',
  eu: 'eu',
  ca: 'ca',
  gl: 'gl',
  is: 'is',
  mk: 'mk',
  sq: 'sq',
  sr: 'sr',
  bs: 'bs',
  me: 'me',
  lv: 'lv',
};

// Generate TTS for card text
router.post(
  '/card/:cardId/tts',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { cardId } = req.params;
      const { side = 'front', voice = 'default' } = req.body;
      const userId = req.user!.id;

      // Validate side parameter
      if (!['front', 'back'].includes(side)) {
        return res.status(400).json({
          success: false,
          message: 'Side must be either "front" or "back"',
        });
      }

      // Get card and verify ownership
      const card = await prisma.card.findFirst({
        where: {
          id: cardId,
          ownerId: userId,
        },
        include: {
          frontLanguage: true,
          backLanguage: true,
        },
      });

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Card not found or access denied',
        });
      }

      // Get text and language based on side
      const text = side === 'front' ? card.front : card.back;
      const language =
        side === 'front' ? card.frontLanguage : card.backLanguage;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: `No text content found for card ${side}`,
        });
      }

      // Get language code for TTS (default to English if not supported)
      const languageCode =
        language?.id && languageMapping[language.id] ? language.id : 'en';

      // Create TTS instance
      const tts = new gtts(text, languageCode);

      // Set response headers for audio streaming
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="card-${cardId}-${side}.mp3"`
      );
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      // Generate and stream audio directly
      tts.stream().pipe(res);
    } catch (error) {
      console.error('Error generating TTS:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate text-to-speech audio',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// Generate TTS for arbitrary text (useful for pronunciation examples)
router.post('/tts', authenticate, async (req: AuthRequest, res) => {
  try {
    const { text, language = 'en' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text content is required',
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Text content is too long (maximum 500 characters)',
      });
    }

    // Get language code for TTS (default to English if not supported)
    const languageCode = languageMapping[language] ? language : 'en';

    // Create TTS instance
    const tts = new gtts(text, languageCode);

    // Set response headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="tts-audio.mp3"`);
    res.setHeader('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes

    // Generate and stream audio directly
    tts.stream().pipe(res);
  } catch (error) {
    console.error('Error generating TTS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate text-to-speech audio',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Get supported languages for TTS
router.get('/languages', authenticate, async (req: AuthRequest, res) => {
  try {
    const supportedLanguages = Object.keys(languageMapping).map((code) => ({
      code,
      name: getLanguageName(code),
    }));

    res.json({
      success: true,
      data: supportedLanguages,
    });
  } catch (error) {
    console.error('Error fetching TTS languages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supported languages',
    });
  }
});

// Helper function to get language names (you can expand this)
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    ar: 'Arabic',
    hi: 'Hindi',
    nl: 'Dutch',
    sv: 'Swedish',
    da: 'Danish',
    no: 'Norwegian',
    fi: 'Finnish',
    pl: 'Polish',
    tr: 'Turkish',
    cs: 'Czech',
    hu: 'Hungarian',
    ro: 'Romanian',
    sk: 'Slovak',
    uk: 'Ukrainian',
    bg: 'Bulgarian',
    hr: 'Croatian',
    et: 'Estonian',
    lv: 'Latvian',
    lt: 'Lithuanian',
    sl: 'Slovenian',
    mt: 'Maltese',
    ga: 'Irish',
    cy: 'Welsh',
    eu: 'Basque',
    ca: 'Catalan',
    gl: 'Galician',
    is: 'Icelandic',
    mk: 'Macedonian',
    sq: 'Albanian',
    sr: 'Serbian',
    bs: 'Bosnian',
  };

  return names[code] || code.toUpperCase();
}

export default router;
