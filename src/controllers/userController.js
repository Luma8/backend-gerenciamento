const User = require('../models/User');

/**
 * Controller de Usuário/Perfil
 * Gerencia perfil do usuário, atualização de dados e foto
 */
const userController = {
    /**
     * GET /user/profile
     * Buscar perfil do usuário logado
     */
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({
                    error: 'Usuário não encontrado',
                    message: 'Usuário não encontrado'
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
     * PUT /user/profile
     * Atualizar dados do perfil (nome)
     */
    async updateProfile(req, res) {
        try {
            const { name } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    error: 'Nome obrigatório',
                    message: 'Informe o nome'
                });
            }

            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({
                    error: 'Usuário não encontrado',
                    message: 'Usuário não encontrado'
                });
            }

            user.name = name.trim();
            await user.save();

            return res.json({
                message: 'Perfil atualizado com sucesso',
                user
            });
        } catch (error) {
            return res.status(400).json({
                error: 'Erro ao atualizar perfil',
                message: error.message
            });
        }
    },

    /**
     * PUT /user/password
     * Atualizar senha
     */
    async updatePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    error: 'Campos obrigatórios',
                    message: 'Informe a senha atual e a nova senha'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    error: 'Senha muito curta',
                    message: 'A nova senha deve ter no mínimo 6 caracteres'
                });
            }

            // Buscar usuário com senha
            const user = await User.findById(req.userId).select('+password');

            if (!user) {
                return res.status(404).json({
                    error: 'Usuário não encontrado',
                    message: 'Usuário não encontrado'
                });
            }

            // Validar senha atual
            const isValidPassword = await user.validatePassword(currentPassword);

            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Senha incorreta',
                    message: 'Senha atual incorreta'
                });
            }

            // Atualizar senha
            user.password = newPassword;
            await user.save();

            return res.json({
                message: 'Senha atualizada com sucesso'
            });
        } catch (error) {
            return res.status(400).json({
                error: 'Erro ao atualizar senha',
                message: error.message
            });
        }
    },

    /**
     * PUT /user/avatar
     * Atualizar foto de perfil (base64 ou URL)
     */
    async updateAvatar(req, res) {
        try {
            const { avatar } = req.body;

            if (!avatar) {
                return res.status(400).json({
                    error: 'Avatar obrigatório',
                    message: 'Informe a imagem do avatar'
                });
            }

            // Validar se é uma URL válida ou base64
            const isUrl = avatar.startsWith('http://') || avatar.startsWith('https://');
            const isBase64 = avatar.startsWith('data:image/');

            if (!isUrl && !isBase64) {
                return res.status(400).json({
                    error: 'Formato inválido',
                    message: 'O avatar deve ser uma URL ou imagem em base64'
                });
            }

            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({
                    error: 'Usuário não encontrado',
                    message: 'Usuário não encontrado'
                });
            }

            user.avatar = avatar;
            await user.save();

            return res.json({
                message: 'Avatar atualizado com sucesso',
                user
            });
        } catch (error) {
            return res.status(400).json({
                error: 'Erro ao atualizar avatar',
                message: error.message
            });
        }
    },

    /**
     * DELETE /user/avatar
     * Remover foto de perfil
     */
    async deleteAvatar(req, res) {
        try {
            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({
                    error: 'Usuário não encontrado',
                    message: 'Usuário não encontrado'
                });
            }

            user.avatar = null;
            await user.save();

            return res.json({
                message: 'Avatar removido com sucesso',
                user
            });
        } catch (error) {
            return res.status(400).json({
                error: 'Erro ao remover avatar',
                message: error.message
            });
        }
    }
};

module.exports = userController;
