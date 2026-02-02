const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: 6,
        select: false // Não retorna senha por padrão
    }
}, {
    timestamps: true
});

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Método para validar senha
userSchema.methods.validatePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Método para retornar usuário sem senha
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);
