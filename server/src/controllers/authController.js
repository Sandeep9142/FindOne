import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { buildAuthResponse, loginUser, registerUser } from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    ...buildAuthResponse(result, 'User registered successfully'),
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  return sendSuccess(res, {
    message: 'Login successful',
    data: result,
  });
});

export const logout = asyncHandler(async (_req, res) => {
  return sendSuccess(res, {
    message: 'Logout successful',
  });
});

export const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: 'Authenticated user fetched successfully',
    data: req.user.toSafeObject(),
  });
});
