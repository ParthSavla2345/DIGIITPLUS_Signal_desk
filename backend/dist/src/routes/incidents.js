"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incidentController_1 = require("../controllers/incidentController");
const router = (0, express_1.Router)();
// Incident CRUD
router.post('/', incidentController_1.createIncidentHandler);
router.get('/', incidentController_1.listIncidentsHandler);
router.get('/:id', incidentController_1.getIncidentHandler);
router.patch('/:id', incidentController_1.updateIncidentHandler);
// AI Operations
router.post('/:id/analyze', incidentController_1.analyzeIncidentHandler);
// Human Operations
router.post('/:id/comments', incidentController_1.addCommentHandler);
router.post('/:id/escalate', incidentController_1.escalateIncidentHandler);
router.post('/:id/resolve', incidentController_1.resolveIncidentHandler);
// Activity
router.get('/:id/activity', incidentController_1.getActivityHandler);
exports.default = router;
//# sourceMappingURL=incidents.js.map