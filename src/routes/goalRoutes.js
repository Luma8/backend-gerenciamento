const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Rotas de Metas
 * Base: /api/goals
 * Todas as rotas são protegidas (requerem autenticação)
 */

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// GET /api/goals/stats - Estatísticas das metas (deve vir antes de /:id)
router.get('/stats', goalController.getStats);

// POST /api/goals - Criar nova meta
router.post('/', goalController.create);

// GET /api/goals - Listar todas as metas
router.get('/', goalController.list);

// GET /api/goals/:id - Buscar meta específica
router.get('/:id', goalController.getById);

// PUT /api/goals/:id - Atualizar meta
router.put('/:id', goalController.update);

// DELETE /api/goals/:id - Remover meta
router.delete('/:id', goalController.delete);

// POST /api/goals/:id/deposits - Adicionar depósito à meta
router.post('/:id/deposits', goalController.addDeposit);

// PUT /api/goals/:id/deposits/:depositId - Atualizar depósito
router.put('/:id/deposits/:depositId', goalController.updateDeposit);

// DELETE /api/goals/:id/deposits/:depositId - Remover depósito
router.delete('/:id/deposits/:depositId', goalController.deleteDeposit);

module.exports = router;
