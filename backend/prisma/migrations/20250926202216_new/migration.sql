-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('TRANSLATION', 'DEFINITION', 'AUDIO_TEXT', 'IMAGE_TEXT', 'FILL_BLANK', 'MULTIPLE_CHOICE', 'GRAMMAR', 'CONVERSATION');

-- CreateEnum
CREATE TYPE "LearningStatus" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'MASTERED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('FREE', 'PREMIUM', 'PRO', 'ENTERPRISE', 'TRIAL', 'EXPIRED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "alphabet" TEXT NOT NULL,
    "flag" TEXT,
    "difficulty" SMALLINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "nativeLanguageId" TEXT NOT NULL,
    "learningLanguageId" TEXT NOT NULL,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
    "subscriptionStartDate" TIMESTAMP(3),
    "subscriptionEndDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "type" "CardType" NOT NULL DEFAULT 'TRANSLATION',
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "hint" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audioUrl" TEXT,
    "imageUrl" TEXT,
    "frontLanguageId" TEXT,
    "backLanguageId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" SMALLINT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "systemCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_statistics" (
    "id" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "averageQuality" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION,
    "averageReviewTime" INTEGER,
    "averageAttempts" DOUBLE PRECISION,
    "masteryRate" DOUBLE PRECISION,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardId" TEXT NOT NULL,

    CONSTRAINT "card_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_versions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "type" "CardType" NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "hint" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audioUrl" TEXT,
    "imageUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" SMALLINT,
    "frontLanguageId" TEXT,
    "backLanguageId" TEXT,
    "changeReason" TEXT,
    "changesSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "card_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_ratings" (
    "id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,

    CONSTRAINT "card_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_certifications" (
    "id" TEXT NOT NULL,
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "certificationNote" TEXT,
    "certifiedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cardId" TEXT NOT NULL,
    "certifiedBy" TEXT NOT NULL,

    CONSTRAINT "card_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_ratings" (
    "id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,

    CONSTRAINT "deck_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_certifications" (
    "id" TEXT NOT NULL,
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "certificationNote" TEXT,
    "certifiedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deckId" TEXT NOT NULL,
    "certifiedBy" TEXT NOT NULL,

    CONSTRAINT "deck_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_statistics" (
    "id" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalStudySessions" INTEGER NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "completionRate" DOUBLE PRECISION,
    "averageCompletionTime" INTEGER,
    "cardCount" INTEGER NOT NULL DEFAULT 0,
    "averageCardDifficulty" DOUBLE PRECISION,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "forkCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "lastStudiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deckId" TEXT NOT NULL,

    CONSTRAINT "deck_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "systemCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_cards" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deck_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_card_statuses" (
    "id" TEXT NOT NULL,
    "status" "LearningStatus" NOT NULL DEFAULT 'NEW',
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "lastQuality" SMALLINT,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetition" INTEGER NOT NULL DEFAULT 0,
    "easiness" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,

    CONSTRAINT "user_card_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_deck_statuses" (
    "id" TEXT NOT NULL,
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,

    CONSTRAINT "user_deck_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_nativeLanguageId_idx" ON "users"("nativeLanguageId");

-- CreateIndex
CREATE INDEX "users_learningLanguageId_idx" ON "users"("learningLanguageId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_subscriptionStatus_idx" ON "users"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "users_subscriptionEndDate_idx" ON "users"("subscriptionEndDate");

-- CreateIndex
CREATE INDEX "users_subscriptionStatus_subscriptionEndDate_idx" ON "users"("subscriptionStatus", "subscriptionEndDate");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "cards_ownerId_idx" ON "cards"("ownerId");

-- CreateIndex
CREATE INDEX "cards_type_idx" ON "cards"("type");

-- CreateIndex
CREATE INDEX "cards_isShared_idx" ON "cards"("isShared");

-- CreateIndex
CREATE INDEX "cards_tags_idx" ON "cards"("tags");

-- CreateIndex
CREATE INDEX "cards_frontLanguageId_idx" ON "cards"("frontLanguageId");

-- CreateIndex
CREATE INDEX "cards_backLanguageId_idx" ON "cards"("backLanguageId");

-- CreateIndex
CREATE INDEX "cards_difficulty_idx" ON "cards"("difficulty");

-- CreateIndex
CREATE INDEX "cards_createdAt_idx" ON "cards"("createdAt");

-- CreateIndex
CREATE INDEX "cards_isArchived_idx" ON "cards"("isArchived");

-- CreateIndex
CREATE INDEX "cards_isSystem_idx" ON "cards"("isSystem");

-- CreateIndex
CREATE INDEX "cards_systemCategory_idx" ON "cards"("systemCategory");

-- CreateIndex
CREATE INDEX "cards_isShared_type_idx" ON "cards"("isShared", "type");

-- CreateIndex
CREATE INDEX "cards_frontLanguageId_backLanguageId_idx" ON "cards"("frontLanguageId", "backLanguageId");

-- CreateIndex
CREATE INDEX "cards_isShared_isArchived_idx" ON "cards"("isShared", "isArchived");

-- CreateIndex
CREATE INDEX "cards_isSystem_systemCategory_idx" ON "cards"("isSystem", "systemCategory");

-- CreateIndex
CREATE INDEX "cards_isSystem_frontLanguageId_idx" ON "cards"("isSystem", "frontLanguageId");

-- CreateIndex
CREATE UNIQUE INDEX "card_statistics_cardId_key" ON "card_statistics"("cardId");

-- CreateIndex
CREATE INDEX "card_statistics_totalViews_idx" ON "card_statistics"("totalViews");

-- CreateIndex
CREATE INDEX "card_statistics_successRate_idx" ON "card_statistics"("successRate");

-- CreateIndex
CREATE INDEX "card_statistics_averageQuality_idx" ON "card_statistics"("averageQuality");

-- CreateIndex
CREATE INDEX "card_statistics_lastReviewedAt_idx" ON "card_statistics"("lastReviewedAt");

-- CreateIndex
CREATE INDEX "card_versions_cardId_idx" ON "card_versions"("cardId");

-- CreateIndex
CREATE INDEX "card_versions_createdBy_idx" ON "card_versions"("createdBy");

-- CreateIndex
CREATE INDEX "card_versions_createdAt_idx" ON "card_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "card_versions_cardId_version_key" ON "card_versions"("cardId", "version");

-- CreateIndex
CREATE INDEX "card_ratings_cardId_idx" ON "card_ratings"("cardId");

-- CreateIndex
CREATE INDEX "card_ratings_rating_idx" ON "card_ratings"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "card_ratings_userId_cardId_key" ON "card_ratings"("userId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "card_certifications_cardId_key" ON "card_certifications"("cardId");

-- CreateIndex
CREATE INDEX "card_certifications_isCertified_idx" ON "card_certifications"("isCertified");

-- CreateIndex
CREATE INDEX "card_certifications_certifiedBy_idx" ON "card_certifications"("certifiedBy");

-- CreateIndex
CREATE INDEX "card_certifications_certifiedAt_idx" ON "card_certifications"("certifiedAt");

-- CreateIndex
CREATE INDEX "deck_ratings_deckId_idx" ON "deck_ratings"("deckId");

-- CreateIndex
CREATE INDEX "deck_ratings_rating_idx" ON "deck_ratings"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "deck_ratings_userId_deckId_key" ON "deck_ratings"("userId", "deckId");

-- CreateIndex
CREATE UNIQUE INDEX "deck_certifications_deckId_key" ON "deck_certifications"("deckId");

-- CreateIndex
CREATE INDEX "deck_certifications_isCertified_idx" ON "deck_certifications"("isCertified");

-- CreateIndex
CREATE INDEX "deck_certifications_certifiedBy_idx" ON "deck_certifications"("certifiedBy");

-- CreateIndex
CREATE INDEX "deck_certifications_certifiedAt_idx" ON "deck_certifications"("certifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "deck_statistics_deckId_key" ON "deck_statistics"("deckId");

-- CreateIndex
CREATE INDEX "deck_statistics_totalViews_idx" ON "deck_statistics"("totalViews");

-- CreateIndex
CREATE INDEX "deck_statistics_averageRating_idx" ON "deck_statistics"("averageRating");

-- CreateIndex
CREATE INDEX "deck_statistics_completionRate_idx" ON "deck_statistics"("completionRate");

-- CreateIndex
CREATE INDEX "deck_statistics_lastStudiedAt_idx" ON "deck_statistics"("lastStudiedAt");

-- CreateIndex
CREATE INDEX "decks_ownerId_idx" ON "decks"("ownerId");

-- CreateIndex
CREATE INDEX "decks_isShared_idx" ON "decks"("isShared");

-- CreateIndex
CREATE INDEX "decks_createdAt_idx" ON "decks"("createdAt");

-- CreateIndex
CREATE INDEX "decks_isArchived_idx" ON "decks"("isArchived");

-- CreateIndex
CREATE INDEX "decks_isSystem_idx" ON "decks"("isSystem");

-- CreateIndex
CREATE INDEX "decks_systemCategory_idx" ON "decks"("systemCategory");

-- CreateIndex
CREATE INDEX "decks_isShared_isArchived_idx" ON "decks"("isShared", "isArchived");

-- CreateIndex
CREATE INDEX "decks_isSystem_systemCategory_idx" ON "decks"("isSystem", "systemCategory");

-- CreateIndex
CREATE INDEX "deck_cards_deckId_idx" ON "deck_cards"("deckId");

-- CreateIndex
CREATE INDEX "deck_cards_cardId_idx" ON "deck_cards"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "deck_cards_deckId_cardId_key" ON "deck_cards"("deckId", "cardId");

-- CreateIndex
CREATE INDEX "user_card_statuses_userId_idx" ON "user_card_statuses"("userId");

-- CreateIndex
CREATE INDEX "user_card_statuses_cardId_idx" ON "user_card_statuses"("cardId");

-- CreateIndex
CREATE INDEX "user_card_statuses_status_idx" ON "user_card_statuses"("status");

-- CreateIndex
CREATE INDEX "user_card_statuses_nextReviewAt_idx" ON "user_card_statuses"("nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_card_statuses_userId_cardId_key" ON "user_card_statuses"("userId", "cardId");

-- CreateIndex
CREATE INDEX "user_deck_statuses_userId_idx" ON "user_deck_statuses"("userId");

-- CreateIndex
CREATE INDEX "user_deck_statuses_deckId_idx" ON "user_deck_statuses"("deckId");

-- CreateIndex
CREATE INDEX "user_deck_statuses_isBookmarked_idx" ON "user_deck_statuses"("isBookmarked");

-- CreateIndex
CREATE INDEX "user_deck_statuses_accessedAt_idx" ON "user_deck_statuses"("accessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_deck_statuses_userId_deckId_key" ON "user_deck_statuses"("userId", "deckId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_nativeLanguageId_fkey" FOREIGN KEY ("nativeLanguageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_learningLanguageId_fkey" FOREIGN KEY ("learningLanguageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_frontLanguageId_fkey" FOREIGN KEY ("frontLanguageId") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_backLanguageId_fkey" FOREIGN KEY ("backLanguageId") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_statistics" ADD CONSTRAINT "card_statistics_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_versions" ADD CONSTRAINT "card_versions_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_versions" ADD CONSTRAINT "card_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_versions" ADD CONSTRAINT "card_versions_frontLanguageId_fkey" FOREIGN KEY ("frontLanguageId") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_versions" ADD CONSTRAINT "card_versions_backLanguageId_fkey" FOREIGN KEY ("backLanguageId") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_ratings" ADD CONSTRAINT "card_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_ratings" ADD CONSTRAINT "card_ratings_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_certifications" ADD CONSTRAINT "card_certifications_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_certifications" ADD CONSTRAINT "card_certifications_certifiedBy_fkey" FOREIGN KEY ("certifiedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_ratings" ADD CONSTRAINT "deck_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_ratings" ADD CONSTRAINT "deck_ratings_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_certifications" ADD CONSTRAINT "deck_certifications_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_certifications" ADD CONSTRAINT "deck_certifications_certifiedBy_fkey" FOREIGN KEY ("certifiedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_statistics" ADD CONSTRAINT "deck_statistics_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_card_statuses" ADD CONSTRAINT "user_card_statuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_card_statuses" ADD CONSTRAINT "user_card_statuses_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_deck_statuses" ADD CONSTRAINT "user_deck_statuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_deck_statuses" ADD CONSTRAINT "user_deck_statuses_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
