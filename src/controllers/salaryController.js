const Salary = require('../models/Salary');

/**
 * Controller de Salário
 * Gerencia os salários mensais do usuário
 */
const salaryController = {
    /**
     * POST /salaries
     * Criar ou atualizar salário de um mês
     */
    async create(req, res) {
        try {
            const { month, year, amount } = req.body;
            const userId = req.userId;

            // Validações
            if (!amount || amount <= 0) {
                return res.status(400).json({ 
                    error: 'Valor inválido',
                    message: 'O valor do salário deve ser maior que zero'
                });
            }

            // Se não informar mês/ano, usar atual
            const now = new Date();
            const salaryMonth = month || (now.getMonth() + 1);
            const salaryYear = year || now.getFullYear();

            // Validar mês
            if (salaryMonth < 1 || salaryMonth > 12) {
                return res.status(400).json({ 
                    error: 'Mês inválido',
                    message: 'O mês deve estar entre 1 e 12'
                });
            }

            // Tentar atualizar ou criar
            const salary = await Salary.findOneAndUpdate(
                { userId, month: salaryMonth, year: salaryYear },
                { amount: parseFloat(amount) },
                { new: true, upsert: true, runValidators: true }
            );

            return res.status(201).json({
                message: 'Salário registrado com sucesso',
                salary
            });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao registrar salário',
                message: error.message
            });
        }
    },

    /**
     * GET /salaries
     * Listar todos os salários do usuário
     */
    async list(req, res) {
        try {
            const salaries = await Salary.find({ userId: req.userId })
                .sort({ year: -1, month: -1 });

            return res.json({
                count: salaries.length,
                salaries
            });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao listar salários',
                message: error.message
            });
        }
    },

    /**
     * GET /salaries/current
     * Buscar salário do mês atual
     */
    async current(req, res) {
        try {
            const now = new Date();
            const salary = await Salary.findOne({
                userId: req.userId,
                month: now.getMonth() + 1,
                year: now.getFullYear()
            });

            if (!salary) {
                return res.status(404).json({ 
                    error: 'Salário não encontrado',
                    message: 'Você ainda não cadastrou o salário deste mês'
                });
            }

            return res.json({ salary });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao buscar salário',
                message: error.message
            });
        }
    },

    /**
     * GET /salaries/:month/:year
     * Buscar salário de um mês específico
     */
    async getByMonthYear(req, res) {
        try {
            const { month, year } = req.params;
            const salary = await Salary.findOne({
                userId: req.userId,
                month: parseInt(month),
                year: parseInt(year)
            });

            if (!salary) {
                return res.status(404).json({ 
                    error: 'Salário não encontrado',
                    message: `Não há salário cadastrado para ${month}/${year}`
                });
            }

            return res.json({ salary });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao buscar salário',
                message: error.message
            });
        }
    },

    /**
     * DELETE /salaries/:id
     * Remover registro de salário
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Salary.findOneAndDelete({
                _id: id,
                userId: req.userId
            });

            if (!deleted) {
                return res.status(404).json({ 
                    error: 'Salário não encontrado',
                    message: 'Não foi possível encontrar este registro de salário'
                });
            }

            return res.json({
                message: 'Salário removido com sucesso'
            });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao remover salário',
                message: error.message
            });
        }
    }
};

module.exports = salaryController;
