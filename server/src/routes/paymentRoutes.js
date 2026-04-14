import { Router } from 'express';
import {
  createNewPayment,
  getPayment,
  getPayments,
  patchPaymentStatus,
  razorpayWebhook,
  verifyPayment,
} from '../controllers/paymentController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  createPaymentSchema,
  listPaymentsSchema,
  paymentIdParamsSchema,
  updatePaymentStatusSchema,
  verifyPaymentSchema,
} from '../validators/paymentValidators.js';

const router = Router();

// Webhook body is parsed as raw in app.js before express.json middleware.
router.post('/webhook/razorpay', (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body.toString('utf-8');
  } else if (typeof req.body === 'string') {
    req.rawBody = req.body;
  } else {
    req.rawBody = JSON.stringify(req.body || {});
  }

  next();
}, razorpayWebhook);

router.use(protect);

router.get('/', validateRequest(listPaymentsSchema), getPayments);
router.get('/:id', validateRequest(paymentIdParamsSchema), getPayment);
router.post('/', authorize('client', 'admin'), validateRequest(createPaymentSchema), createNewPayment);
router.post('/:id/verify', authorize('client', 'admin'), validateRequest(verifyPaymentSchema), verifyPayment);
router.patch('/:id/status', authorize('client', 'admin'), validateRequest(updatePaymentStatusSchema), patchPaymentStatus);

export default router;
