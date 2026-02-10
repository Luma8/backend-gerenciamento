const mongoose = require('mongoose');

/**
 * Meta financeira:
 * O usuário define um objetivo (ex: comprar TV, mudar de casa)
 * Define o valor total e prazo estimado
 * Pode depositar valores mensalmente
 * A estimativa mensal se ajusta automaticamente conforme os depósitos
 */

const depositSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    month: {
        type: Number, // 1-12
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String,
        trim: true
    }
}, { _id: true });

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Nome da meta é obrigatório'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    targetAmount: {
        type: Number,
        required: [true, 'Valor total da meta é obrigatório'],
        min: 0
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    estimatedMonths: {
        type: Number,
        required: [true, 'Prazo estimado em meses é obrigatório'],
        min: 1
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    targetDate: {
        type: Date
    },
    color: {
        type: String,
        default: '#10b981',
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida']
    },
    deposits: [depositSchema],
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Virtual para calcular o progresso em percentual
goalSchema.virtual('progress').get(function() {
    if (this.targetAmount === 0) return 0;
    return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Virtual para calcular valor mensal sugerido baseado no restante e meses restantes
goalSchema.virtual('suggestedMonthlyAmount').get(function() {
    const remaining = this.targetAmount - this.currentAmount;
    if (remaining <= 0) return 0;
    
    const now = new Date();
    const target = this.targetDate || new Date(this.startDate.getTime() + (this.estimatedMonths * 30 * 24 * 60 * 60 * 1000));
    const monthsRemaining = Math.max(1, Math.ceil((target - now) / (30 * 24 * 60 * 60 * 1000)));
    
    return remaining / monthsRemaining;
});

// Virtual para calcular meses restantes
goalSchema.virtual('monthsRemaining').get(function() {
    const now = new Date();
    const target = this.targetDate || new Date(this.startDate.getTime() + (this.estimatedMonths * 30 * 24 * 60 * 60 * 1000));
    return Math.max(0, Math.ceil((target - now) / (30 * 24 * 60 * 60 * 1000)));
});

// Garantir que virtuals sejam incluídos em JSON
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

// Método para adicionar depósito
goalSchema.methods.addDeposit = function(amount, month, year, note = '') {
    this.deposits.push({ amount, month, year, note });
    this.currentAmount += amount;
    
    // Verificar se completou a meta
    if (this.currentAmount >= this.targetAmount && !this.isCompleted) {
        this.isCompleted = true;
        this.completedAt = new Date();
    }
    
    return this.save();
};

// Método para remover depósito
goalSchema.methods.removeDeposit = function(depositId) {
    const deposit = this.deposits.id(depositId);
    if (!deposit) {
        throw new Error('Depósito não encontrado');
    }
    
    this.currentAmount -= deposit.amount;
    this.deposits.pull(depositId);
    
    // Se estava completa e agora não está mais
    if (this.currentAmount < this.targetAmount && this.isCompleted) {
        this.isCompleted = false;
        this.completedAt = null;
    }
    
    return this.save();
};

// Método para atualizar depósito
goalSchema.methods.updateDeposit = function(depositId, newAmount, month, year, note) {
    const deposit = this.deposits.id(depositId);
    if (!deposit) {
        throw new Error('Depósito não encontrado');
    }
    
    const oldAmount = deposit.amount;
    deposit.amount = newAmount;
    deposit.month = month;
    deposit.year = year;
    if (note !== undefined) deposit.note = note;
    
    this.currentAmount = this.currentAmount - oldAmount + newAmount;
    
    // Verificar conclusão
    if (this.currentAmount >= this.targetAmount && !this.isCompleted) {
        this.isCompleted = true;
        this.completedAt = new Date();
    } else if (this.currentAmount < this.targetAmount && this.isCompleted) {
        this.isCompleted = false;
        this.completedAt = null;
    }
    
    return this.save();
};

// Índices para melhor performance
goalSchema.index({ userId: 1, isCompleted: 1 });
goalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Goal', goalSchema);
