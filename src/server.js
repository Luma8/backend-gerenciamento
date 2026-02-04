require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Rota de status
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'API Gerenciamento de Gastos v2.0',
        database: 'MongoDB Atlas',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/me',
                updateProfile: 'PUT /api/auth/me'
            },
            salaries: {
                create: 'POST /api/salaries',
                list: 'GET /api/salaries',
                current: 'GET /api/salaries/current',
                byMonth: 'GET /api/salaries/:month/:year',
                delete: 'DELETE /api/salaries/:id'
            },
            debts: {
                create: 'POST /api/debts',
                list: 'GET /api/debts',
                summary: 'GET /api/debts/summary',
                getById: 'GET /api/debts/:id',
                update: 'PUT /api/debts/:id',
                pay: 'POST /api/debts/:id/pay',
                delete: 'DELETE /api/debts/:id'
            }
        },
        debtTypes: {
            installment: 'Dívida parcelada (ex: 1x a 12x)',
            weekly: 'Dívida semanal (recorrente toda semana)',
            monthly: 'Dívida mensal contínua (recorrente todo mês)'
        }
    });
});

// Rotas da API
app.use('/api', routes);

// Tratamento de rota não encontrada
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        message: `A rota ${req.method} ${req.path} não existe`
    });
});

// Tratamento de erros globais
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

// Iniciar servidor
const startServer = async () => {
    // Conectar ao MongoDB
    await connectDB();

    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🚀 API Gerenciamento de Gastos v2.0                       ║
║                                                            ║
║   Server Local: http://localhost:${PORT}                   ║
║   Database: MongoDB Atlas                                  ║
║                                                            ║
║   Endpoints:                                               ║
║   • Auth:     /api/auth/*                                  ║
║   • Salários: /api/salaries/*                              ║
║   • Dívidas:  /api/debts/*                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
        `);
    });
};

startServer();

module.exports = app;
