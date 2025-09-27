-- Initial database setup for L1xi
-- This file runs automatically when the container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The rest will be handled by Prisma migrations