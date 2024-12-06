const express = require("express");
const path = require("path");
const session = require("express-session");
const fileUpload = require("express-fileupload")

const app = express();


// Configurações do servidor
app.set('views', path.join(__dirname, 'views')); // Configura o diretório das views
app.set('view engine', 'ejs')  //Configura o motor de templates para EJS
app.use(express.static(path.join(__dirname, 'public'))); //Define pasta para arquivos css / img
app.use(express.urlencoded({ extended: true })) //Para processar os dados do formulário
app.use(express.json());  // utilizar dados em formato JSON
app.use(session({
    secret: 'sesisenai', // Um segredo para assinar a sessão
    resave: false,
    saveUninitialized: true,
}))
app.use(fileUpload())



// Middleware para verificar se o usuario esta logado
const verificarAutenticacao = (req, res, next) => {
    if (req.session.usuarioLogado) {
        // Disponibilizando o nomeUsuario da sessão para a tela .ejs
        res.locals.usuarioLogado = req.session.usuarioLogado || null;;
        res.locals.nomeUsuario  = req.session.nomeUsuario || null;
        res.locals.id_usuario = req.session.idUsuario || null;
        next()
    } else {
        // res.locals.usuarioLogado = "Teste";
        // res.locals.nomeUsuario = "Teste";
        // res.locals.idUsuario = 1;
        // next()
        res.redirect('/auth/login')
    }
}

app.get('/', (req, res) => {
    //    views/landing/index.ejs
    res.render('landing/index')
})

// Utilizando rotas admin
const adminRotas = require('./routes/admin')
app.use('/admin', verificarAutenticacao, adminRotas)

// Utilizando rotas de categorias
const categoriasRotas = require('./routes/categoriasRotas')
app.use('/categorias', verificarAutenticacao, categoriasRotas)

// Utilizando rotas de usuarios
const usuariosRotas = require('./routes/usuariosRotas')
app.use('/usuarios', verificarAutenticacao, usuariosRotas)

// Utilizando rotas de produtos
const produtosRotas = require('./routes/produtosRotas')
app.use('/produtos', verificarAutenticacao, produtosRotas)


// Utilizando rotas de login
const loginRotas = require('./routes/loginRotas')
app.use('/auth', loginRotas)



// //  Utilizando rotas de movimentações
// const movimentacoesRotas = require ('./routes/movimentacoesRotas')
// app.use('/movimentacoes', movimentacoesRotas)

const porta = 3000
app.listen(porta, () => {
    console.log(`Servidor rodando na porta http://192.168.0.119:${porta}`);
    
})