import { Request, Response, NextFunction } from 'express';
import { ModulesService } from './modules.service.js';

export class ModulesController {
  static async listModules(req: Request, res: Response, next: NextFunction) {
    try {
      const modules = await ModulesService.listModules();
      res.status(200).json(modules);
    } catch (error) {
      next(error);
    }
  }
}
