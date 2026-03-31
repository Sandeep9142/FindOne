import { Router } from 'express';
import {
  createNewPayment,
  getPayment,
  getPayments,
  patchPaymentStatus,
} from '../controllers/paymentController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  createPaymentSchema,
  listPaymentsSchema,
  paymentIdParamsSchema,
  updatePaymentStatusSchema,
} from '../validators/paymentValidators.js';

const router = Router();

router.use(protect);
router.get('/', validateRequest(listPaymentsSchema), getPayments);
router.get('/:id', validateRequest(paymentIdParamsSchema), getPayment);
router.post('/', authorize('client', 'admin'), validateRequest(createPaymentSchema), createNewPayment);
router.patch('/:id/status', authorize('client', 'admin'), validateRequest(updatePaymentStatusSchema), patchPaymentStatus);

export default router;
