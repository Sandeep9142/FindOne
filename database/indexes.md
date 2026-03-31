# FindOne MongoDB Indexes

Recommended indexes for the first version.

## `users`

- unique: `{ email: 1 }`
- unique sparse: `{ phone: 1 }`
- index: `{ role: 1, isActive: 1 }`

## `workerProfiles`

- unique: `{ userId: 1 }`
- index: `{ categories: 1 }`
- index: `{ skills: 1 }`
- index: `{ isAvailableNow: 1, verificationStatus: 1 }`
- index: `{ ratingAverage: -1, jobsCompleted: -1 }`
- text: `{ headline: "text", bio: "text", skills: "text" }`

## `clientProfiles`

- unique: `{ userId: 1 }`

## `categories`

- unique: `{ slug: 1 }`
- index: `{ isActive: 1, sortOrder: 1 }`

## `jobs`

- index: `{ clientId: 1, createdAt: -1 }`
- index: `{ categoryId: 1, status: 1 }`
- index: `{ assignedWorkerId: 1, status: 1 }`
- index: `{ scheduledDate: 1, status: 1 }`
- text: `{ title: "text", description: "text", skillsRequired: "text" }`

## `jobApplications`

- unique: `{ jobId: 1, workerId: 1 }`
- index: `{ workerId: 1, status: 1, createdAt: -1 }`

## `bookings`

- index: `{ clientId: 1, createdAt: -1 }`
- index: `{ workerId: 1, bookingDate: 1 }`
- index: `{ status: 1, paymentStatus: 1 }`

## `reviews`

- index: `{ workerId: 1, createdAt: -1 }`
- unique sparse: `{ bookingId: 1 }`
- unique sparse: `{ jobId: 1 }`

## `conversations`

- index: `{ participantIds: 1, lastMessageAt: -1 }`
- index: `{ jobId: 1 }`
- index: `{ bookingId: 1 }`

## `messages`

- index: `{ conversationId: 1, createdAt: 1 }`
- index: `{ senderId: 1, createdAt: -1 }`

## `payments`

- index: `{ clientId: 1, createdAt: -1 }`
- index: `{ workerId: 1, createdAt: -1 }`
- index: `{ status: 1, createdAt: -1 }`
- unique sparse: `{ providerPaymentId: 1 }`
