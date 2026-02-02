const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Rotas de Autenticação
 * Base: /api/auth
 */

// Rotas públicas (não precisam de login)
router.post('/register', authController.register);  // Criar conta
router.post('/login', authController.login);        // Fazer login

// Rotas protegidas (precisam de login)
router.get('/me', authMiddleware, authController.me);           // Ver perfil
router.put('/me', authMiddleware, authController.updateProfile); // Atualizar perfil

module.exports = router;
