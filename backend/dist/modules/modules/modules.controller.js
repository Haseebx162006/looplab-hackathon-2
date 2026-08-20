import { ModulesService } from './modules.service.js';
export class ModulesController {
    static async listModules(req, res, next) {
        try {
            const modules = await ModulesService.listModules();
            res.status(200).json(modules);
        }
        catch (error) {
            next(error);
        }
    }
}
