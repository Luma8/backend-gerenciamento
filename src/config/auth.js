/**
 * Configurações de autenticação
 */

module.exports = {
    secret: process.env.JWT_SECRET || 'gerenciamento-secret-key-2024',
    expiresIn: '7d' // Token expira em 7 dias
};
