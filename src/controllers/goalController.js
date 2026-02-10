const Goal = require('../models/Goal');

/**
 * Controller de Metas
 * Gerencia o CRUD de metas financeiras e seus depósitos
 */
const goalController = {
    /**
     * POST /goals
     * Criar nova meta
     */
    async create(req, res) {
        try {
            const { name, description, targetAmount, estimatedMonths, color } = req.body;
            const userId = req.userId;

            // Validações
            if (!name || !name.trim()) {
                return res.status(400).json({ 
                    error: 'Nome obrigatório',
                    message: 'Informe o nome da meta'
                });
            }

            if (!targetAmount || targetAmount <= 0) {
                return res.status(400).json({ 
                    error: 'Valor inválido',
                    message: 'O valor da meta deve ser maior que zero'
                });
            }

            if (!estimatedMonths || estimatedMonths < 1) {
                return res.status(400).json({ 
                    error: 'Prazo inválido',
                    message: 'O prazo estimado deve ser de pelo menos 1 mês'
                });
            }

            // Calcular data alvo
            const startDate = new Date();
            const targetDate = new Date(startDate.getTime() + (estimatedMonths * 30 * 24 * 60 * 60 * 1000));

            const goal = await Goal.create({
                userId,
                name: name.trim(),
                description: description?.trim(),
                targetAmount: parseFloat(targetAmount),
                estimatedMonths: parseInt(estimatedMonths),
                startDate,
                targetDate,
                color: color || '#10b981',
                currentAmount: 0,
                deposits: []
            });

            return res.status(201).json({
                message: 'Meta criada com sucesso',
                goal
            });
        } catch (error) {
            return res.status(400).json({ 
                error: 'Erro ao criar meta',
                message: error.message
            });
        }
    },

    /**
     * GET /goals
     * Listar todas as metas do usuário
     */
    async list(req, res) {
        try {
            const { isCompleted } = req.query;
            
            const filter = { userId: req.userId };
            if (isCompleted !== undefined) {
                filter.isCompleted = isCompleted === 'true';
            }

            const goals = await Goal.find(filter)
                .sort({ isCompleted: 1, createdAt: -1 });

            return res.json({ goals });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao listar metas',
                message: error.message
            });
        }
    },

    /**
     * GET /goals/:id
     * Buscar meta específica
     */
    async getById(req, res) {
        try {
            const goal = await Goal.findOne({
                _id: req.params.id,
                userId: req.userId
            });

            if (!goal) {
                return res.status(404).json({
                    error: 'Meta não encontrada',
                    message: 'Meta não encontrada ou você não tem permissão'
                });
            }

            return res.json({ goal });
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao buscar meta',
                message: error.message
            });
        }
    },

    /**
     * PUT /goals/:id
     * Atualizar meta
     */
    async update(req, res) {
        try {
            const { name, description, targetAmount, estimatedMonths, color } = req.body;

            const goal = await Goal.findOne({
                _id: req.params.id,
                userId: req.userId
            });

            if (!goal) {
                return res.status(404).json({
                    error: 'Meta não encontrada',
                    message: 'Meta não encontrada ou você não tem permissão'
                });
            }

            // Atualizar campos
            if (name !== undefined) goal.name = name.trim();
            if (description !== undefined) goal.description = description?.trim();
            if (color !== undefined) goal.color = color;
            
            // Se alterar valor alvo ou prazo, recalcular data alvo
            if (targetAmount !== undefined) {
                goal.targetAmount = parseFloat(targetAmount);
                
                // Se já atingiu o novo valor
                if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
                    goal.isCompleted = true;
                    goal.completedAt = new Date();
                } else if (goal.currentAmount < goal.targetAmount && goal.isCompleted) {
                    goal.isCompleted = false;
                    goal.completedAt = null;
                }
            }
            
            if (estimatedMonths !== undefined) {
                goal.estimatedMonths = parseInt(estimatedMonths);
                goal.targetDate = new Date(goal.startDate.getTime() + (goal.estimatedMonths * 30 * 24 * 60 * 60 * 1000));
            }

            await goal.save();

            return res.json({
                message: 'Meta atualizada com sucesso',
                goal
            });
        } catch (error) {
            return res.status(400).json({
                error: 'Erro ao atualizar meta',
                message: error.message
            });
        }
    },

    /**
     * DELETE /goals/:id
     * Deletar meta
     */
    async delete(req, res) {
        try {
            const goal = await Goal.findOneAndDelete({
                _id: req.params.id,
                userId: req.userId
            });

            if (!goal) {
                return res.status(404).json({
                    error: 'Meta não encontrada',
                    message: 'Meta não encontrada ou você não tem permissão'
                });
            }

            return res.json({
                message: 'Meta deletada com sucesso',
                goal
            });
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao deletar meta',
                message: error.message
            });
        }
    },

    /**
     * POST /goals/:id/deposits
     * Adicionar depósito à meta
     */
    async addDeposit(req, res) {
        try {
            const { amount, month, year, note } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    error: 'Valor inválido',
                    message: 'O valor do depósito deve ser maior que zero'
                });
            }

            if (!month || month < 1 || month > 12) {
                return res.status(400).json({
                    error: 'Mês inválido',
                    message: 'O mês deve estar entre 1 e 12'
                });
            }

            if (!year || year < 2000) {
                return res.status(400).json({
                    error: 'Ano inválido',
                    message: 'Informe um ano válido'
                });
            }

            const goal = await Goal.findOne({
                _id: req.params.id,
                userId: req.userId
            });

            if (!goal) {
                return res.status(404).json({
                    error: 'Meta não encontrada',
                    message: 'Meta não encontrada ou você não tem permissão'
                });
            }

            await goal.addDeposit(parseFloat(amount), parseInt(month), parseInt(year), note?.trim());

            return res.status(201).json({
                message: 'Depósito adicionado com sucesso',
                goal
            });
        } catch (error) {
            return res.status(400).json({
                error: 'Erro ao adicionar depósito',
                message: error.message
            });
        }
    },

    /**
     * PUT /goals/:id/deposits/:depositId
     * Atualizar depósito
     */
    async updateDeposit(req, res) {
        try {
            const { amount, month, year, note } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    error: 'Valor inválido',
                    message: 'O valor do depósito deve ser maior que zero'
                });
            }

            if (!month || month < 1 || month > 12) {
                return res.status(400).json({
                    error: 'Mês inválido',
                    message: 'O mês deve estar entre 1 e 12'
                });
            }

            if (!year || year < 2000) {
                return res.status(400).json({
                    error: 'Ano inválido',
                    message: 'Informe um ano válido'
                });
            }

            const goal = await Goal.findOne({
                _id: req.params.id,
                userId: req.userId
            });

            if (!goal) {
                return res.status(404).json({
                    error: 'Meta não encontrada',
                    message: 'Meta não encontrada ou você não tem permissão'
                });
            }

            await goal.updateDeposit(
                req.params.depositId,
                parseFloat(amount),
                parseInt(month),
                parseInt(year),
                note?.trim()
            );

            return res.json({
                message: 'Depósito atualizado com sucesso',
                goal
            });
        } catch (error) {
            return res.status(400).json({
                error: 'Erro ao atualizar depósito',
                message: error.message
            });
        }
    },

    /**
     * DELETE /goals/:id/deposits/:depositId
     * Remover depósito
     */
    async deleteDeposit(req, res) {
        try {
            const goal = await Goal.findOne({
                _id: req.params.id,
                userId: req.userId
            });

            if (!goal) {
                return res.status(404).json({
                    error: 'Meta não encontrada',
                    message: 'Meta não encontrada ou você não tem permissão'
                });
            }

            await goal.removeDeposit(req.params.depositId);

            return res.json({
                message: 'Depósito removido com sucesso',
                goal
            });
        } catch (error) {
            return res.status(400).json({
                error: 'Erro ao remover depósito',
                message: error.message
            });
        }
    },

    /**
     * GET /goals/stats
     * Estatísticas gerais das metas
     */
    async getStats(req, res) {
        try {
            const goals = await Goal.find({ userId: req.userId });

            const stats = {
                total: goals.length,
                completed: goals.filter(g => g.isCompleted).length,
                active: goals.filter(g => !g.isCompleted).length,
                totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
                totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
                totalRemaining: goals.reduce((sum, g) => sum + Math.max(0, g.targetAmount - g.currentAmount), 0),
                averageProgress: goals.length > 0 
                    ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length 
                    : 0
            };

            return res.json({ stats });
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao calcular estatísticas',
                message: error.message
            });
        }
    }
};

module.exports = goalController;
