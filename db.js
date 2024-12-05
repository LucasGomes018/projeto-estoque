const { Pool } = require('pg')

const BD =  new Pool({
    user: 'postgres', // Nome usuário do banco de dados
    host: 'localhost', // Endereço do servidor
    database: 'projeto', // Nome do banco de dados
    password: 'admin', // Senha do banco de dados
    port: 5432, // Porta de conexão do servidor
})

module.exports = BD