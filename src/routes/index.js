const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const salaryRoutes = require('./salaryRoutes');
const debtRoutes = require('./debtRoutes');

/**
 * Agregador de rotas
 * Centraliza todas as rotas da API
 */

router.use('/auth', authRoutes);
router.use('/salaries', salaryRoutes);
router.use('/debts', debtRoutes);

module.exports = router;
