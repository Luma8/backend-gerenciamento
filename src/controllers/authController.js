const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authConfig = require('../config/auth');

/**
 * Controller de Autenticação
 * Gerencia registro, login e perfil do usuário
 */
const authController = {
    /**
     * POST /auth/register
     * Criar nova conta de usuário
     */
    async register(req, res) {
        try {
            const { name, email, password } = req.body;

            // Validações
            if (!name || !email || !password) {
                return res.status(400).json({ 
                    error: 'Dados incompletos',
                    message: 'Nome, email e senha são obrigatórios'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({ 
                    error: 'Senha muito curta',
                    message: 'A senha deve ter no mínimo 6 caracteres'
                });
            }

            // Validar formato do email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    error: 'Email inválido',
                    message: 'Por favor, informe um email válido'
                });
            }

            // Verificar se email já existe
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ 
                    error: 'Email já cadastrado',
                    message: 'Este email já está em uso'
                });
            }

            // Criar usuário
            const user = await User.create({ name, email, password });

            // Gerar token
            const token = jwt.sign(
                { id: user._id, email: user.email },
                authConfig.secret,
                { expiresIn: authConfig.expiresIn }
            );

            return res.status(201).json({
                message: 'Conta criada com sucesso',
                user,
                token
            });
        } catch (error) {
            console.error('Erro no registro:', error);
            return res.status(400).json({ 
                error: 'Erro ao criar conta',
                message: error.message
            });
        }
    },

    /**
     * POST /auth/login
     * Fazer login e receber token
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validações
            if (!email || !password) {
                return res.status(400).json({ 
                    error: 'Dados incompletos',
                    message: 'Email e senha são obrigatórios'
                });
            }

            // Buscar usuário com senha
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(401).json({ 
                    error: 'Credenciais inválidas',
                    message: 'Email ou senha incorretos'
                });
            }

            // Validar senha
            const isValidPassword = await user.validatePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    error: 'Credenciais inválidas',
                    message: 'Email ou senha incorretos'
                });
            }

            // Gerar token
            const token = jwt.sign(
                { id: user._id, email: user.email },
                authConfig.secret,
                { expiresIn: authConfig.expiresIn }
            );

            return res.json({
                message: 'Login realizado com sucesso',
                user,
                token
            });
        } catch (error) {
            console.error('Erro no login:', error);
            return res.status(500).json({ 
                error: 'Erro ao fazer login',
                message: error.message
            });
        }
    },

    /**
     * GET /auth/me
     * Retorna dados do usuário logado
     */
    async me(req, res) {
        try {
            const user = await User.findById(req.userId);
            
            if (!user) {
                return res.status(404).json({ 
                    error: 'Usuário não encontrado',
                    message: 'Não foi possível encontrar seu perfil'
                });
            }

            return res.json({ user });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao buscar perfil',
                message: error.message
            });
        }
    },

    /**
     * PUT /auth/me
     * Atualiza dados do usuário logado
     */
    async updateProfile(req, res) {
        try {
            const { name, email } = req.body;
            
            const user = await User.findByIdAndUpdate(
                req.userId, 
                { name, email },
                { new: true, runValidators: true }
            );
            
            if (!user) {
                return res.status(404).json({ 
                    error: 'Usuário não encontrado',
                    message: 'Não foi possível atualizar seu perfil'
                });
            }

            return res.json({
                message: 'Perfil atualizado com sucesso',
                user
            });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao atualizar perfil',
                message: error.message
            });
        }
    }
};

module.exports = authController;
