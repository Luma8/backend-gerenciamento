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
            const { name, amount, type, installments, interestRate, dueDate, hasMonthlyRecurrence } = req.body;
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

            // Validação da taxa de juros
            const rate = interestRate ? parseFloat(interestRate) : 0;
            if (rate < 0 || rate > 100) {
                return res.status(400).json({ 
                    error: 'Taxa inválida',
                    message: 'A taxa de juros deve estar entre 0% e 100%'
                });
            }

            // Validação da data de vencimento
            let parsedDueDate = null;
            if (dueDate) {
                parsedDueDate = new Date(dueDate);
                if (isNaN(parsedDueDate.getTime())) {
                    return res.status(400).json({ 
                        error: 'Data inválida',
                        message: 'A data de vencimento deve ser uma data válida'
                    });
                }
            }

            const debt = await Debt.create({
                userId,
                name: name.trim(),
                amount: parseFloat(amount),
                type,
                color: req.body.color || '#8b5cf6',
                installments: type === 'installment' ? parseInt(installments) : null,
                currentInstallment: type === 'installment' ? 1 : null,
                interestRate: rate,
                dueDate: parsedDueDate,
                hasMonthlyRecurrence: hasMonthlyRecurrence || false
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
     * Calcular juros acumulados de uma dívida
     */
    calculateInterest(debt) {
        if (debt.interestRate === 0 || !debt.dueDate) return 0;
        
        const now = new Date();
        const dueDate = new Date(debt.dueDate);
        const lastPayment = debt.lastPaymentDate ? new Date(debt.lastPaymentDate) : null;
        
        // Se já foi paga neste mês, não calcula juros
        if (lastPayment && lastPayment.getMonth() === now.getMonth() && lastPayment.getFullYear() === now.getFullYear()) {
            return 0;
        }
        
        const daysOverdue = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));
        const monthsOverdue = daysOverdue / 30; // aproximado
        
        return debt.amount * (debt.interestRate / 100) * monthsOverdue;
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

            // Calcular juros acumulados antes do pagamento
            const accruedInterest = this.calculateInterest(debt);
            const totalToPay = debt.amount + accruedInterest;

            // Atualizar data do último pagamento
            debt.lastPaymentDate = new Date();

            // Para dívidas com recorrência mensal, as parcelas continuam indefinidamente
            if (debt.hasMonthlyRecurrence) {
                // Não incrementa currentInstallment, mantém o mesmo
                // Apenas atualiza a data do último pagamento
            } else {
                // Lógica normal para parcelas finitas
                if (debt.currentInstallment >= debt.installments) {
                    debt.isPaid = true;
                } else {
                    debt.currentInstallment += 1;
                }
            }

            await debt.save();

            let message;
            if (debt.hasMonthlyRecurrence) {
                message = `Parcela paga! Valor: R$ ${totalToPay.toFixed(2)} (R$ ${debt.amount.toFixed(2)} + R$ ${accruedInterest.toFixed(2)} juros)`;
            } else {
                message = debt.isPaid 
                    ? 'Última parcela paga! Dívida quitada!' 
                    : `Parcela ${debt.currentInstallment - 1} paga! Próxima: ${debt.currentInstallment}/${debt.installments}`;
            }

            return res.json({
                message,
                debt,
                paymentDetails: {
                    principal: debt.amount,
                    interest: accruedInterest,
                    total: totalToPay
                }
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

            // Buscar todas as dívidas (pagas e não pagas)
            // Para não retornar valor ao salário quando "quitadas" (exceto parceladas finalizadas que não devem contar mais)
            const allDebts = await Debt.find({ userId });

            // Calcular totais
            let totalMonthly = 0;
            let totalWeekly = 0;
            let totalInterest = 0;

            allDebts.forEach(debt => {
                // Se for parcelada e já terminou (isPaid = true), verificar se foi paga neste mês
                // Se foi paga neste mês (pela data de atualização), consideramos como gasto do mês.
                // Se foi paga em meses anteriores, ignoramos.
                if (debt.type === 'installment' && debt.isPaid && !debt.hasMonthlyRecurrence) {
                    const updatedDate = new Date(debt.updatedAt);
                    const isPaidThisMonth = updatedDate.getMonth() === now.getMonth() && 
                                          updatedDate.getFullYear() === now.getFullYear();
                    
                    if (!isPaidThisMonth) {
                        return;
                    }
                }

                // Calcular juros para dívidas parceladas
                let interest = 0;
                if (debt.type === 'installment') {
                    interest = this.calculateInterest(debt);
                    totalInterest += interest;
                }

                if (debt.type === 'installment' || debt.type === 'monthly') {
                    totalMonthly += debt.amount + interest;
                } else if (debt.type === 'weekly') {
                    totalWeekly += debt.amount;
                }
            });

            const weeklyToMonthly = totalWeekly * 4;
            const grandTotalMonthly = totalMonthly + weeklyToMonthly;
            const remaining = salary - grandTotalMonthly;

            // Cálculo da porcentagem do salário gasta
            const debtRatio = salary > 0 ? (grandTotalMonthly / salary) * 100 : 0;

            // Análise baseada na porcentagem
            let status, recommendation;
            
            if (salary === 0) {
                 status = 'Sem Salário';
                 recommendation = 'Cadastre seu salário para ver a análise.';
            } else if (debtRatio <= 25) {
                status = 'Excelente';
                recommendation = 'Sua saúde financeira está ótima! (Gastos entre 0% e 25% da renda).';
            } else if (debtRatio <= 40) {
                status = 'Cuidado';
                recommendation = 'Atenção aos gastos, você está comprometendo uma parte considerável da renda (25% a 40%).';
            } else {
                status = 'Ajuste suas dívidas'; // Ou 'Melhore isso'
                recommendation = 'Seus gastos ultrapassaram 40% da renda. É hora de revisar e cortar despesas.';
            }

            // Sugestões de distribuição (opcional, mantendo lógica anterior se sobrar dinheiro)
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
                        grandTotalMonthly,
                        totalInterest
                    },
                    remaining: salary - grandTotalMonthly,
                    status,
                    debtRatio: debtRatio.toFixed(1), // Retornando a porcentagem também
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
