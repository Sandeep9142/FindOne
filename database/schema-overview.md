# FindOne Schema Overview

Database: MongoDB
ODM: Mongoose

## Core collections

### 1. `users`

Purpose:
Store authentication and account-level identity for every platform user.

Key fields:

- `_id`
- `fullName`
- `email`
- `phone`
- `passwordHash`
- `role` - `worker | client | admin`
- `avatarUrl`
- `isVerified`
- `isActive`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

Notes:

- Keep auth data in `users`.
- Role-specific profile data should live in separate collections.

### 2. `workerProfiles`

Purpose:
Store worker-facing profile, skills, pricing, ratings, and service coverage.

Key fields:

- `_id`
- `userId` - ref `users`
- `headline`
- `bio`
- `categories` - array of category ids
- `skills` - array of strings
- `experienceYears`
- `hourlyRate`
- `serviceAreas` - city/state/pincode entries
- `availability` - weekly availability structure
- `languages`
- `portfolioImages`
- `ratingAverage`
- `ratingCount`
- `jobsCompleted`
- `backgroundCheckStatus`
- `verificationStatus`
- `isAvailableNow`
- `createdAt`
- `updatedAt`

### 3. `clientProfiles`

Purpose:
Store client-specific profile details separate from base auth data.

Key fields:

- `_id`
- `userId` - ref `users`
- `companyName`
- `address`
- `preferredLocations`
- `createdAt`
- `updatedAt`

### 4. `categories`

Purpose:
Store service categories used across workers, jobs, and search.

Key fields:

- `_id`
- `slug`
- `name`
- `description`
- `icon`
- `isActive`
- `sortOrder`
- `createdAt`
- `updatedAt`

### 5. `jobs`

Purpose:
Store jobs posted by clients.

Key fields:

- `_id`
- `clientId` - ref `users`
- `categoryId` - ref `categories`
- `title`
- `description`
- `skillsRequired`
- `location`
- `budgetType` - `fixed | hourly`
- `budgetMin`
- `budgetMax`
- `status` - `open | assigned | in_progress | completed | cancelled`
- `urgency` - `low | medium | high`
- `scheduledDate`
- `assignedWorkerId` - ref `users`
- `applicationCount`
- `createdAt`
- `updatedAt`

### 6. `jobApplications`

Purpose:
Track worker applications for open jobs.

Key fields:

- `_id`
- `jobId` - ref `jobs`
- `workerId` - ref `users`
- `coverMessage`
- `proposedRate`
- `status` - `pending | shortlisted | accepted | rejected | withdrawn`
- `createdAt`
- `updatedAt`

### 7. `bookings`

Purpose:
Store direct worker bookings created by clients.

Key fields:

- `_id`
- `clientId` - ref `users`
- `workerId` - ref `users`
- `categoryId` - ref `categories`
- `title`
- `description`
- `bookingDate`
- `timeSlot`
- `address`
- `pricingType` - `fixed | hourly`
- `amount`
- `status` - `pending | confirmed | in_progress | completed | cancelled`
- `paymentStatus` - `pending | authorized | paid | refunded | failed`
- `notes`
- `createdAt`
- `updatedAt`

### 8. `reviews`

Purpose:
Store feedback after completed jobs or bookings.

Key fields:

- `_id`
- `bookingId` - ref `bookings`, optional
- `jobId` - ref `jobs`, optional
- `clientId` - ref `users`
- `workerId` - ref `users`
- `rating`
- `comment`
- `tags`
- `createdAt`
- `updatedAt`

Rule:

- A review should belong to either a booking or a job outcome.

### 9. `conversations`

Purpose:
Track messaging threads between clients and workers.

Key fields:

- `_id`
- `participantIds` - refs `users`
- `jobId` - optional ref `jobs`
- `bookingId` - optional ref `bookings`
- `lastMessageId`
- `lastMessageAt`
- `createdAt`
- `updatedAt`

### 10. `messages`

Purpose:
Store chat messages.

Key fields:

- `_id`
- `conversationId` - ref `conversations`
- `senderId` - ref `users`
- `messageType` - `text | image | system`
- `text`
- `attachments`
- `readBy`
- `createdAt`
- `updatedAt`

### 11. `payments`

Purpose:
Store payment and payout records.

Key fields:

- `_id`
- `bookingId` - optional ref `bookings`
- `jobId` - optional ref `jobs`
- `clientId` - ref `users`
- `workerId` - ref `users`
- `amount`
- `currency`
- `provider`
- `providerPaymentId`
- `status` - `pending | paid | failed | refunded`
- `paidAt`
- `createdAt`
- `updatedAt`

## Relationship summary

- One `user` can have one `workerProfile` or one `clientProfile`.
- One `client` can create many `jobs`.
- One `job` can have many `jobApplications`.
- One `job` can be assigned to one worker.
- One `client` can create many `bookings`.
- One `worker` can receive many `bookings`.
- One completed booking or job can create one review from a client.
- One conversation contains many messages.

## Suggested implementation order

1. `users`
2. `categories`
3. `workerProfiles`
4. `clientProfiles`
5. `jobs`
6. `jobApplications`
7. `bookings`
8. `reviews`
9. `conversations`
10. `messages`
11. `payments`
