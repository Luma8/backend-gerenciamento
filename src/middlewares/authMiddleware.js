const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const User = require('../models/User');

/**
 * Middleware de autenticação
 * Verifica se o usuário está logado através do token JWT
 */
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ 
            error: 'Token não fornecido',
            message: 'Você precisa estar logado para acessar este recurso'
        });
    }

    // Formato: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ 
            error: 'Token mal formatado',
            message: 'O formato do token deve ser: Bearer <token>'
        });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ 
            error: 'Token mal formatado',
            message: 'O formato do token deve ser: Bearer <token>'
        });
    }

    try {
        const decoded = jwt.verify(token, authConfig.secret);
        
        // Verificar se usuário ainda existe
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ 
                error: 'Usuário não encontrado',
                message: 'O usuário associado a este token não existe mais'
            });
        }

        // Adicionar dados do usuário na requisição
        req.userId = decoded.id;
        req.userEmail = decoded.email;

        return next();
    } catch (err) {
        return res.status(401).json({ 
            error: 'Token inválido',
            message: 'Seu token expirou ou é inválido. Faça login novamente'
        });
    }
};

module.exports = authMiddleware;
