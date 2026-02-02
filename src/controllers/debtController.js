const Debt = require('../models/Debt');
const Salary = require('../models/Salary');

/**
 * Controller de Dívidas
 * Gerencia o CRUD de dívidas do usuário
 */
const debtController = {
    /**
     * POST /debts
     * Criar nova dívida
     */
    async create(req, res) {
        try {
            const { name, amount, type, installments } = req.body;
            const userId = req.userId;

            // Validações
            if (!name || !name.trim()) {
                return res.status(400).json({ 
                    error: 'Nome obrigatório',
                    message: 'Informe o nome da dívida'
                });
            }

            if (!amount || amount <= 0) {
                return res.status(400).json({ 
                    error: 'Valor inválido',
                    message: 'O valor da dívida deve ser maior que zero'
                });
            }

            if (!type) {
                return res.status(400).json({ 
                    error: 'Tipo obrigatório',
                    message: 'Informe o tipo: installment (parcelada), weekly (semanal) ou monthly (mensal)'
                });
            }

            // Para tipo parcelado, parcelas são obrigatórias
            if (type === 'installment' && (!installments || installments < 1)) {
                return res.status(400).json({ 
                    error: 'Parcelas obrigatórias',
                    message: 'Para dívidas parceladas, informe a quantidade de parcelas'
                });
            }

            const debt = await Debt.create({
                userId,
                name: name.trim(),
                amount: parseFloat(amount),
                type,
                color: req.body.color || '#8b5cf6',
                installments: type === 'installment' ? parseInt(installments) : null,
                currentInstallment: type === 'installment' ? 1 : null
            });

            return res.status(201).json({
                message: 'Dívida criada com sucesso',
                debt
            });
        } catch (error) {
            return res.status(400).json({ 
                error: 'Erro ao criar dívida',
                message: error.message
            });
        }
    },

    /**
     * GET /debts
     * Listar todas as dívidas do usuário
     */
    async list(req, res) {
        try {
            const { type, isPaid } = req.query;
            
            const filter = { userId: req.userId };
            if (type) filter.type = type;
            if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

            const debts = await Debt.find(filter).sort({ createdAt: -1 });

            return res.json({
                count: debts.length,
                debts
            });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao listar dívidas',
                message: error.message
            });
        }
    },

    /**
     * GET /debts/:id
     * Buscar dívida específica
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const debt = await Debt.findOne({ _id: id, userId: req.userId });

            if (!debt) {
                return res.status(404).json({ 
                    error: 'Dívida não encontrada',
                    message: 'Não foi possível encontrar esta dívida'
                });
            }

            return res.json({ debt });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao buscar dívida',
                message: error.message
            });
        }
    },

    /**
     * PUT /debts/:id
     * Atualizar dívida
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, amount, type, installments, currentInstallment, isPaid, color } = req.body;

            const updateData = {};
            if (name) updateData.name = name;
            if (amount) updateData.amount = parseFloat(amount);
            if (type) updateData.type = type;
            if (color) updateData.color = color;
            if (installments) updateData.installments = parseInt(installments);
            if (currentInstallment) updateData.currentInstallment = parseInt(currentInstallment);
            if (isPaid !== undefined) updateData.isPaid = isPaid;

            const debt = await Debt.findOneAndUpdate(
                { _id: id, userId: req.userId },
                updateData,
                { new: true, runValidators: true }
            );

            if (!debt) {
                return res.status(404).json({ 
                    error: 'Dívida não encontrada',
                    message: 'Não foi possível encontrar esta dívida'
                });
            }

            return res.json({
                message: 'Dívida atualizada com sucesso',
                debt
            });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao atualizar dívida',
                message: error.message
            });
        }
    },

    /**
     * POST /debts/:id/pay
     * Pagar uma parcela (para dívidas parceladas)
     */
    async payInstallment(req, res) {
        try {
            const { id } = req.params;
            const debt = await Debt.findOne({ _id: id, userId: req.userId });

            if (!debt) {
                return res.status(404).json({ 
                    error: 'Dívida não encontrada',
                    message: 'Não foi possível encontrar esta dívida'
                });
            }

            if (debt.type !== 'installment') {
                return res.status(400).json({ 
                    error: 'Operação inválida',
                    message: 'Apenas dívidas parceladas podem ter parcelas pagas'
                });
            }

            if (debt.currentInstallment >= debt.installments) {
                debt.isPaid = true;
            } else {
                debt.currentInstallment += 1;
            }

            await debt.save();

            const message = debt.isPaid 
                ? 'Última parcela paga! Dívida quitada!' 
                : `Parcela ${debt.currentInstallment - 1} paga! Próxima: ${debt.currentInstallment}/${debt.installments}`;

            return res.json({
                message,
                debt
            });
        } catch (error) {
            return res.status(400).json({ 
                error: 'Erro ao pagar parcela',
                message: error.message
            });
        }
    },

    /**
     * DELETE /debts/:id
     * Remover dívida
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Debt.findOneAndDelete({
                _id: id,
                userId: req.userId
            });

            if (!deleted) {
                return res.status(404).json({ 
                    error: 'Dívida não encontrada',
                    message: 'Não foi possível encontrar esta dívida'
                });
            }

            return res.json({
                message: 'Dívida removida com sucesso'
            });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao remover dívida',
                message: error.message
            });
        }
    },

    /**
     * GET /debts/summary
     * Resumo financeiro do usuário
     */
    async summary(req, res) {
        try {
            const userId = req.userId;

            // Buscar salário atual
            const now = new Date();
            const currentSalary = await Salary.findOne({
                userId,
                month: now.getMonth() + 1,
                year: now.getFullYear()
            });
            const salary = currentSalary ? currentSalary.amount : 0;

            // Buscar dívidas não pagas
            const debts = await Debt.find({ userId, isPaid: false });

            // Calcular totais
            let totalMonthly = 0;
            let totalWeekly = 0;

            debts.forEach(debt => {
                if (debt.type === 'installment' || debt.type === 'monthly') {
                    totalMonthly += debt.amount;
                } else if (debt.type === 'weekly') {
                    totalWeekly += debt.amount;
                }
            });

            const weeklyToMonthly = totalWeekly * 4;
            const grandTotalMonthly = totalMonthly + weeklyToMonthly;
            const remaining = salary - grandTotalMonthly;

            // Análise
            let status, recommendation;
            if (remaining > salary * 0.3) {
                status = 'Excelente';
                recommendation = 'Você está com uma boa folga! Considere investir ou criar uma reserva de emergência.';
            } else if (remaining > salary * 0.1) {
                status = 'Bom';
                recommendation = 'Suas finanças estão equilibradas. Tente manter ou reduzir um pouco os gastos.';
            } else if (remaining > 0) {
                status = 'Atenção';
                recommendation = 'Sua margem está apertada. Considere revisar seus gastos.';
            } else {
                status = 'Crítico';
                recommendation = 'Você está gastando mais do que ganha! Revise urgentemente suas dívidas.';
            }

            // Sugestões de distribuição
            let suggestions = null;
            if (remaining > 0) {
                suggestions = {
                    emergency: remaining * 0.50,
                    leisure: remaining * 0.30,
                    personalDevelopment: remaining * 0.20
                };
            }

            return res.json({
                summary: {
                    salary,
                    debts: {
                        total: totalMonthly + totalWeekly,
                        totalMonthly,
                        totalWeekly,
                        weeklyToMonthly,
                        grandTotalMonthly
                    },
                    remaining,
                    status,
                    recommendation,
                    suggestions
                }
            });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao gerar resumo',
                message: error.message
            });
        }
    }
};

module.exports = debtController;
