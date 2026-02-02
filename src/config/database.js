const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            console.log('⚠️  MONGODB_URI não configurada. Usando banco em memória...');
            return false;
        }

        await mongoose.connect(mongoURI);
        
        console.log('✅ MongoDB conectado com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        console.log('⚠️  Continuando com banco em memória...');
        return false;
    }
};

module.exports = connectDB;
