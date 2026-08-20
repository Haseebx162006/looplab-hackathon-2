import { Router } from 'express';
import { ModulesController } from './modules.controller.js';
const router = Router();
router.get('/', ModulesController.listModules);
export default router;
