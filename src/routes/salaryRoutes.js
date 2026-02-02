const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Rotas de Salário
 * Base: /api/salaries
 * Todas as rotas são protegidas (requerem autenticação)
 */

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// POST /api/salaries - Criar/atualizar salário
router.post('/', salaryController.create);

// GET /api/salaries - Listar todos os salários
router.get('/', salaryController.list);

// GET /api/salaries/current - Salário do mês atual
router.get('/current', salaryController.current);

// GET /api/salaries/:month/:year - Salário de um mês específico
router.get('/:month/:year', salaryController.getByMonthYear);

// DELETE /api/salaries/:id - Remover salário
router.delete('/:id', salaryController.delete);

module.exports = router;
