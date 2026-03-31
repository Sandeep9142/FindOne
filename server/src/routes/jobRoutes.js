import { Router } from 'express';
import {
  applyForJob,
  createClientJob,
  deleteClientJob,
  getApplicationsForJob,
  getJob,
  getJobs,
  getMyAppliedJobs,
  getMyPostedJobs,
  updateClientJob,
} from '../controllers/jobController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  applyToJobSchema,
  createJobSchema,
  jobIdParamsSchema,
  listJobsSchema,
  updateJobSchema,
} from '../validators/jobValidators.js';

const router = Router();

router.get('/my/posted', protect, authorize('client', 'admin'), getMyPostedJobs);
router.get('/my/applied', protect, authorize('worker', 'admin'), getMyAppliedJobs);
router.get('/', validateRequest(listJobsSchema), getJobs);
router.get('/:id', validateRequest(jobIdParamsSchema), getJob);
router.post('/', protect, authorize('client', 'admin'), validateRequest(createJobSchema), createClientJob);
router.put('/:id', protect, authorize('client', 'admin'), validateRequest(updateJobSchema), updateClientJob);
router.delete('/:id', protect, authorize('client', 'admin'), validateRequest(jobIdParamsSchema), deleteClientJob);
router.post('/:id/apply', protect, authorize('worker', 'admin'), validateRequest(applyToJobSchema), applyForJob);
router.get('/:id/applications', protect, authorize('client', 'admin'), validateRequest(jobIdParamsSchema), getApplicationsForJob);

export default router;
