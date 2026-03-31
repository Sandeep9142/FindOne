import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { USER_ROLES } from '../config/constants.js';
import { User } from '../models/index.js';
import AppError from '../utils/AppError.js';

function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function validateRegistrationInput(payload) {
  const { fullName, email, password, role } = payload;

  if (!fullName?.trim()) {
    throw new AppError('Full name is required', 400);
  }

  if (!email?.trim()) {
    throw new AppError('Email is required', 400);
  }

  if (!password || password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  if (role && !USER_ROLES.includes(role)) {
    throw new AppError('Invalid user role', 400);
  }
}

function validateLoginInput(payload) {
  const { email, password } = payload;

  if (!email?.trim()) {
    throw new AppError('Email is required', 400);
  }

  if (!password) {
    throw new AppError('Password is required', 400);
  }
}

export async function registerUser(payload) {
  validateRegistrationInput(payload);

  const fullName = payload.fullName.trim();
  const email = payload.email.trim().toLowerCase();
  const phone = payload.phone?.trim() || undefined;
  const role = payload.role || 'client';

  const existingUser = await User.findOne({
    $or: [{ email }, ...(phone ? [{ phone }] : [])],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError('Email is already registered', 409);
    }

    throw new AppError('Phone number is already registered', 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const user = await User.create({
    fullName,
    email,
    phone,
    passwordHash,
    role,
  });

  const token = signToken(user._id.toString());

  return {
    token,
    user: user.toSafeObject(),
  };
}

export async function loginUser(payload) {
  validateLoginInput(payload);

  const email = payload.email.trim().toLowerCase();
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account is inactive', 403);
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id.toString());

  return {
    token,
    user: user.toSafeObject(),
  };
}

export function buildAuthResponse(result, message) {
  return {
    message,
    data: result,
  };
}
