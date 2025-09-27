import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in dependency order)
  try {
    console.log('🧹 Clearing existing data...');
    await prisma.userCardStatus.deleteMany();
    await prisma.userDeckStatus.deleteMany();
    await prisma.cardRating.deleteMany();
    await prisma.deckRating.deleteMany();
    await prisma.cardCertification.deleteMany();
    await prisma.deckCertification.deleteMany();
    await prisma.cardVersion.deleteMany();
    await prisma.cardStatistics.deleteMany();
    await prisma.deckStatistics.deleteMany();
    await prisma.deckCard.deleteMany();
    await prisma.card.deleteMany();
    await prisma.deck.deleteMany();
    await prisma.user.deleteMany();
    await prisma.language.deleteMany();
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.log(
      "ℹ️ Tables don't exist yet or are empty, continuing with seeding..."
    );
  }

  // Create languages
  console.log('🌍 Creating languages...');
  const languages = await Promise.all([
    prisma.language.create({
      data: {
        id: 'en',
        name: 'English',
        nativeName: 'English',
        alphabet: 'Latin',
        flag: '🇺🇸',
        difficulty: 1,
      },
    }),
    prisma.language.create({
      data: {
        id: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        alphabet: 'Latin',
        flag: '🇪🇸',
        difficulty: 2,
      },
    }),
    prisma.language.create({
      data: {
        id: 'fr',
        name: 'French',
        nativeName: 'Français',
        alphabet: 'Latin',
        flag: '🇫🇷',
        difficulty: 3,
      },
    }),
    prisma.language.create({
      data: {
        id: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        alphabet: 'Latin',
        flag: '��',
        difficulty: 4,
      },
    }),
    prisma.language.create({
      data: {
        id: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        alphabet: 'Hiragana/Katakana/Kanji',
        flag: '🇯🇵',
        difficulty: 5,
      },
    }),
    prisma.language.create({
      data: {
        id: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        alphabet: 'Cyrillic',
        flag: '��',
        difficulty: 4,
      },
    }),
    prisma.language.create({
      data: {
        id: 'ko',
        name: 'Korean',
        nativeName: '한국어',
        alphabet: 'Hangul',
        flag: '🇰🇷',
        difficulty: 5,
      },
    }),
    prisma.language.create({
      data: {
        id: 'zh',
        name: 'Chinese (Simplified)',
        nativeName: '中文',
        alphabet: 'Hanzi',
        flag: '🇨🇳',
        difficulty: 5,
      },
    }),
  ]);

  const [english, spanish, french, german, japanese, russian, korean, chinese] =
    languages;
  console.log('✅ Created languages');

  // Create demo users with different subscription levels
  const hashedPassword = await bcrypt.hash('password123', 12);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@l1xi.com',
      username: 'demo_user',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'USER',
      nativeLanguageId: english.id,
      learningLanguageId: spanish.id,
      subscriptionStatus: 'PREMIUM',
      subscriptionStartDate: new Date('2024-01-01'),
      subscriptionEndDate: new Date('2025-01-01'),
    },
  });

  const johnUser = await prisma.user.create({
    data: {
      email: 'john@example.com',
      username: 'john_doe',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      nativeLanguageId: english.id,
      learningLanguageId: german.id,
      subscriptionStatus: 'FREE',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@l1xi.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      nativeLanguageId: english.id,
      learningLanguageId: japanese.id,
      subscriptionStatus: 'ENTERPRISE',
      subscriptionStartDate: new Date('2024-01-01'),
      subscriptionEndDate: new Date('2025-12-31'),
    },
  });

  const modoUser = await prisma.user.create({
    data: {
      email: 'modo@l1xi.com',
      username: 'moderator',
      password: hashedPassword,
      firstName: 'Moderator',
      lastName: 'User',
      role: 'MODO',
      nativeLanguageId: english.id,
      learningLanguageId: russian.id,
      subscriptionStatus: 'PRO',
      subscriptionStartDate: new Date('2024-06-01'),
      subscriptionEndDate: new Date('2025-06-01'),
    },
  });

  console.log('✅ Created demo users');

  // Create sample decks
  const spanishDeck = await prisma.deck.create({
    data: {
      title: 'Spanish Basics',
      description: 'Essential Spanish words and phrases for beginners',
      isShared: true,
      isSystem: false,
      ownerId: demoUser.id,
    },
  });

  const germanDeck = await prisma.deck.create({
    data: {
      title: 'German Grammar Essentials',
      description:
        'German grammar rules and examples for intermediate learners',
      isShared: true,
      isSystem: false,
      ownerId: johnUser.id,
    },
  });

  const systemJapaneseDeck = await prisma.deck.create({
    data: {
      title: 'Official Japanese Course - Level 1',
      description:
        'Official beginner Japanese course with hiragana and basic vocabulary',
      isShared: true,
      isSystem: true,
      systemCategory: 'beginner',
      ownerId: null, // System content has no owner
    },
  });

  const systemRussianDeck = await prisma.deck.create({
    data: {
      title: 'Russian Alphabet & Pronunciation',
      description: 'Learn the Cyrillic alphabet and Russian pronunciation',
      isShared: true,
      isSystem: true,
      systemCategory: 'official',
      ownerId: null, // System content has no owner
    },
  });

  console.log('✅ Created sample decks');

  // Create sample cards for Spanish deck
  const spanishCards = [
    {
      type: 'TRANSLATION',
      front: 'Hello',
      back: 'Hola',
      hint: 'A common greeting',
      tags: ['greeting', 'basic'],
      difficulty: 1,
      frontLanguageId: english.id,
      backLanguageId: spanish.id,
      ownerId: demoUser.id,
    },
    {
      type: 'TRANSLATION',
      front: 'Thank you',
      back: 'Gracias',
      hint: 'Show appreciation',
      tags: ['courtesy', 'basic'],
      difficulty: 1,
      frontLanguageId: english.id,
      backLanguageId: spanish.id,
      ownerId: demoUser.id,
    },
    {
      type: 'AUDIO_TEXT',
      front: 'Pronunciation: Rr',
      back: 'The Spanish rolled R sound',
      hint: 'Vibrate your tongue against the roof of your mouth',
      audioUrl: 'https://example.com/spanish-rr.mp3',
      tags: ['pronunciation', 'phonics'],
      difficulty: 3,
      frontLanguageId: spanish.id,
      backLanguageId: spanish.id,
      ownerId: demoUser.id,
    },
  ];

  const createdSpanishCards = [];
  for (const cardData of spanishCards) {
    const card = await prisma.card.create({
      data: cardData,
    });
    createdSpanishCards.push(card);

    // Add to deck
    await prisma.deckCard.create({
      data: {
        deckId: spanishDeck.id,
        cardId: card.id,
      },
    });
  }

  // Create German cards for deck
  const germanCards = [
    {
      type: 'GRAMMAR',
      front: 'Der, die, das',
      back: 'German definite articles - masculine, feminine, neuter',
      hint: 'Articles change based on gender',
      tags: ['grammar', 'articles'],
      difficulty: 2,
      frontLanguageId: german.id,
      backLanguageId: english.id,
      ownerId: johnUser.id,
    },
    {
      type: 'TRANSLATION',
      front: 'Guten Tag',
      back: 'Good day / Hello',
      hint: 'Formal greeting',
      tags: ['greeting', 'formal'],
      difficulty: 1,
      frontLanguageId: german.id,
      backLanguageId: english.id,
      ownerId: johnUser.id,
    },
  ];

  const createdGermanCards = [];
  for (const cardData of germanCards) {
    const card = await prisma.card.create({
      data: cardData,
    });
    createdGermanCards.push(card);

    // Add to deck
    await prisma.deckCard.create({
      data: {
        deckId: germanDeck.id,
        cardId: card.id,
      },
    });
  }

  // Create system Japanese cards (in deck)
  const japaneseSystemCards = [
    {
      type: 'TRANSLATION',
      front: 'Hello',
      back: 'こんにちは',
      hint: 'Konnichiwa - most common greeting',
      tags: ['greeting', 'basic', 'hiragana'],
      difficulty: 1,
      frontLanguageId: english.id,
      backLanguageId: japanese.id,
      isShared: true,
      isSystem: true,
      systemCategory: 'vocabulary',
      ownerId: null,
    },
    {
      type: 'DEFINITION',
      front: 'ひらがな (Hiragana)',
      back: 'Japanese syllabic script used for native Japanese words',
      hint: 'One of three writing systems in Japanese',
      tags: ['writing', 'script'],
      difficulty: 2,
      frontLanguageId: japanese.id,
      backLanguageId: english.id,
      isShared: true,
      isSystem: true,
      systemCategory: 'grammar',
      ownerId: null,
    },
  ];

  const createdJapaneseCards = [];
  for (const cardData of japaneseSystemCards) {
    const card = await prisma.card.create({
      data: cardData,
    });
    createdJapaneseCards.push(card);

    // Add to system deck
    await prisma.deckCard.create({
      data: {
        deckId: systemJapaneseDeck.id,
        cardId: card.id,
      },
    });
  }

  // Create Russian system cards (in deck)
  const russianSystemCards = [
    {
      type: 'TRANSLATION',
      front: 'Hello',
      back: 'Привет',
      hint: 'Informal greeting',
      tags: ['greeting', 'basic', 'cyrillic'],
      difficulty: 2,
      frontLanguageId: english.id,
      backLanguageId: russian.id,
      isShared: true,
      isSystem: true,
      systemCategory: 'vocabulary',
      ownerId: null,
    },
    {
      type: 'AUDIO_TEXT',
      front: 'Russian Alphabet: А',
      back: 'The letter А sounds like "ah"',
      hint: 'First letter of Russian alphabet',
      audioUrl: 'https://example.com/russian-a.mp3',
      tags: ['alphabet', 'pronunciation'],
      difficulty: 1,
      frontLanguageId: russian.id,
      backLanguageId: english.id,
      isShared: true,
      isSystem: true,
      systemCategory: 'pronunciation',
      ownerId: null,
    },
  ];

  const createdRussianCards = [];
  for (const cardData of russianSystemCards) {
    const card = await prisma.card.create({
      data: cardData,
    });
    createdRussianCards.push(card);

    // Add to system deck
    await prisma.deckCard.create({
      data: {
        deckId: systemRussianDeck.id,
        cardId: card.id,
      },
    });
  }

  // Create standalone cards (NOT in any deck)
  const standaloneCards = [
    // German standalone card (no translation, just definition)
    {
      type: 'DEFINITION',
      front: 'Weltschmerz',
      back: 'A feeling of melancholy and world-weariness; the pain of existence',
      hint: 'A uniquely German concept about sadness',
      tags: ['philosophy', 'emotions', 'untranslatable'],
      difficulty: 5,
      frontLanguageId: german.id,
      backLanguageId: english.id,
      isShared: true,
      ownerId: modoUser.id,
    },
    // Japanese standalone card (concept explanation)
    {
      type: 'DEFINITION',
      front: 'わび・さび (Wabi-Sabi)',
      back: 'Japanese aesthetic concept finding beauty in imperfection and impermanence',
      hint: 'Core philosophy in Japanese art and life',
      tags: ['philosophy', 'aesthetics', 'culture'],
      difficulty: 4,
      frontLanguageId: japanese.id,
      backLanguageId: english.id,
      isShared: true,
      ownerId: adminUser.id,
    },
    // Russian cultural concept (no direct translation)
    {
      type: 'DEFINITION',
      front: 'Тоска (Toska)',
      back: 'A Russian emotion combining melancholy, longing, and spiritual anguish that has no direct English equivalent',
      hint: 'Nabokov called it "untranslatable"',
      tags: ['emotions', 'culture', 'untranslatable'],
      difficulty: 5,
      frontLanguageId: russian.id,
      backLanguageId: english.id,
      isShared: true,
      ownerId: modoUser.id,
    },
    // Grammar concept card
    {
      type: 'GRAMMAR',
      front: 'Japanese Particle: を (wo/o)',
      back: 'Marks the direct object of a transitive verb',
      hint: 'Pronounced as "o" despite being written as "wo"',
      tags: ['grammar', 'particles'],
      difficulty: 3,
      frontLanguageId: japanese.id,
      backLanguageId: english.id,
      isShared: true,
      ownerId: adminUser.id,
    },
    // Audio pronunciation card
    {
      type: 'AUDIO_TEXT',
      front: 'German Umlauts: ä, ö, ü',
      back: 'Special German vowels with different pronunciation',
      hint: 'Change the meaning of words completely',
      audioUrl: 'https://example.com/german-umlauts.mp3',
      tags: ['pronunciation', 'vowels'],
      difficulty: 3,
      frontLanguageId: german.id,
      backLanguageId: english.id,
      isShared: true,
      ownerId: johnUser.id,
    },
  ];

  const createdStandaloneCards = [];
  for (const cardData of standaloneCards) {
    const card = await prisma.card.create({
      data: cardData,
    });
    createdStandaloneCards.push(card);
  }

  console.log('✅ Created sample cards');

  // Create card statistics and ratings
  console.log('📊 Creating statistics and ratings...');

  // Add statistics for some cards
  for (const card of createdSpanishCards) {
    await prisma.cardStatistics.create({
      data: {
        cardId: card.id,
        totalViews: Math.floor(Math.random() * 100) + 10,
        totalReviews: Math.floor(Math.random() * 50) + 5,
        uniqueUsers: Math.floor(Math.random() * 20) + 2,
        averageQuality: Math.random() * 2 + 3, // 3-5 range
        successRate: Math.random() * 40 + 60, // 60-100% range
      },
    });
  }

  // Add ratings for cards
  for (let i = 0; i < createdSpanishCards.length; i++) {
    await prisma.cardRating.create({
      data: {
        userId: johnUser.id,
        cardId: createdSpanishCards[i].id,
        rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
        comment: i === 0 ? 'Great for beginners!' : null,
      },
    });
  }

  // Add certifications for system cards
  for (const card of createdJapaneseCards) {
    await prisma.cardCertification.create({
      data: {
        cardId: card.id,
        certifiedBy: adminUser.id,
        isCertified: true,
        certificationNote: 'Verified by Japanese language expert',
        certifiedAt: new Date(),
      },
    });
  }

  // Create user card statuses (learning progress)
  await prisma.userCardStatus.create({
    data: {
      userId: demoUser.id,
      cardId: createdSpanishCards[0].id,
      status: 'LEARNING',
      reviewCount: 3,
      correctCount: 2,
      lastQuality: 4,
      interval: 2,
      repetition: 1,
      easiness: 2.6,
      lastReviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Created statistics and ratings');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n🔐 Demo accounts:');
  console.log('📧 demo@l1xi.com (Premium User)');
  console.log('🔑 Password: password123');
  console.log('');
  console.log('📧 john@example.com (Free User)');
  console.log('🔑 Password: password123');
  console.log('');
  console.log('📧 admin@l1xi.com (Admin User)');
  console.log('🔑 Password: password123');
  console.log('');
  console.log('📧 modo@l1xi.com (Moderator User)');
  console.log('🔑 Password: password123');
  console.log('\n📊 Content created:');
  console.log(
    '• 8 Languages (English, Spanish, French, German, Japanese, Russian, Korean, Chinese)'
  );
  console.log('• 4 Users with different subscription levels');
  console.log('• 4 Decks (2 user-created, 2 system decks)');
  console.log('• Multiple cards including:');
  console.log('  - Translation cards in Spanish, German, Japanese, Russian');
  console.log('  - Grammar and definition cards');
  console.log('  - Audio pronunciation cards');
  console.log('  - Standalone cards not in any deck');
  console.log('  - System-certified content');
  console.log('• User progress tracking and ratings');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
