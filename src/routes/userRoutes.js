const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Rotas de Usuário/Perfil
 * Base: /api/user
 * Todas as rotas são protegidas (requerem autenticação)
 */

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// GET /api/user/profile - Buscar perfil do usuário
router.get('/profile', userController.getProfile);

// PUT /api/user/profile - Atualizar dados do perfil
router.put('/profile', userController.updateProfile);

// PUT /api/user/password - Atualizar senha
router.put('/password', userController.updatePassword);

// PUT /api/user/avatar - Atualizar foto de perfil
router.put('/avatar', userController.updateAvatar);

// DELETE /api/user/avatar - Remover foto de perfil
router.delete('/avatar', userController.deleteAvatar);

module.exports = router;
