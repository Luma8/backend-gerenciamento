const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Rotas de Dívidas
 * Base: /api/debts
 * Todas as rotas são protegidas (requerem autenticação)
 */

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// GET /api/debts/summary - Resumo financeiro (deve vir antes de /:id)
router.get('/summary', debtController.summary);

// POST /api/debts - Criar nova dívida
router.post('/', debtController.create);

// GET /api/debts - Listar todas as dívidas
router.get('/', debtController.list);

// GET /api/debts/:id - Buscar dívida específica
router.get('/:id', debtController.getById);

// PUT /api/debts/:id - Atualizar dívida
router.put('/:id', debtController.update);

// POST /api/debts/:id/pay - Pagar parcela
router.post('/:id/pay', debtController.payInstallment);

// DELETE /api/debts/:id - Remover dívida
router.delete('/:id', debtController.delete);

module.exports = router;
