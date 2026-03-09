const mongoose = require('mongoose');

/**
 * Tipos de dívida:
 * - 'installment' (parcelada): tem quantidade de parcelas definida (1x a 12x ou customizado)
 * - 'weekly' (semanal): se repete toda semana, sem parcelas
 * - 'monthly' (mensal contínua): se repete todo mês, sem parcelas
 */

const debtSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Nome da dívida é obrigatório'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Valor é obrigatório'],
        min: 0
    },
    type: {
        type: String,
        required: true,
        enum: ['installment', 'weekly', 'monthly']
    },
    color: {
        type: String,
        default: '#8b5cf6',
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida']
    },
    installments: {
        type: Number,
        min: 1,
        default: null
    },
    currentInstallment: {
        type: Number,
        min: 1,
        default: 1
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    interestRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100 // taxa mensal em %
    },
    dueDate: {
        type: Date,
        default: null // data de vencimento
    },
    hasMonthlyRecurrence: {
        type: Boolean,
        default: false // se as parcelas se repetem todo mês
    },
    lastPaymentDate: {
        type: Date,
        default: null // última vez que parcela foi paga
    }
}, {
    timestamps: true
});

// Índice para buscar dívidas do usuário
debtSchema.index({ userId: 1, isPaid: 1 });

module.exports = mongoose.model('Debt', debtSchema);
