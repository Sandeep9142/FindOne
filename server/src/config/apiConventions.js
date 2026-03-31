export const API_CONVENTIONS = {
  successShape: {
    success: true,
    message: 'Human-readable summary',
    data: {},
    meta: {},
  },
  errorShape: {
    success: false,
    message: 'Human-readable error summary',
    errors: [],
  },
};
