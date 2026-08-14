import { Router } from 'express';
import {
  createIncidentHandler,
  listIncidentsHandler,
  getIncidentHandler,
  updateIncidentHandler,
  analyzeIncidentHandler,
  executeRemediationHandler,
  addCommentHandler,
  escalateIncidentHandler,
  resolveIncidentHandler,
  getActivityHandler,
} from '../controllers/incidentController';
import { listKnowledgeArticles, getKnowledgeArticleById } from '../repositories/knowledgeRepository';

const router = Router();

// Incident CRUD
router.post('/', createIncidentHandler);
router.get('/', listIncidentsHandler);
router.get('/:id', getIncidentHandler);
router.patch('/:id', updateIncidentHandler);

// AI Operations
router.post('/:id/analyze', analyzeIncidentHandler);
router.post('/:id/remediate', executeRemediationHandler);

// Human Operations
router.post('/:id/comments', addCommentHandler);
router.post('/:id/escalate', escalateIncidentHandler);
router.post('/:id/resolve', resolveIncidentHandler);

// Activity
router.get('/:id/activity', getActivityHandler);

export default router;
