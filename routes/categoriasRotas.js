const express = require('express')
const router = express.Router()
const BD = require('../db')

//Listar categorias (R - Read)
//Rota localhost:3000/disciplinas/
router.get('/', async (req, res) => {
    try {
        const busca = req.query.busca || ''
        const ordenar =  req.query.ordenar || 'nome_categoria'
        const pg = req.query.pg || 1; // Obtendo a página de dados

        const limite = 4; // número de registros por página
        const offset = (pg - 1) * limite; // Qntd de registros que quero "pular"

        const ativos = await BD.get(`SELECT * FROM categorias where inativo = 'null' order by ${ordenar}`, {})

        const buscaDados = await BD.query(` SELECT categorias.nome_categoria, id_categoria from categorias
            where upper(categorias.nome_categoria) like $1 
            order by ${ordenar} limit $2 offset $3`,  [`%${busca.toUpperCase()}%`, limite, offset])

        const totalItens = await BD.query(` SELECT count(*) as total from categorias
            where upper(categorias.nome_categoria) like $1 `,  [`%${busca.toUpperCase()}%`])

        const totalPgs = Math.ceil(totalItens.rows[0].total / limite);

        res.render('categoriasTelas/lista', {
            vetorDados: buscaDados.rows,
            busca : busca,
            ordenar : ordenar,
            ativos : ativos,
            pgAtual: parseInt(pg),
            totalPgs: totalPgs
        })

    } catch ( erro ) {
        console.log('Erro ao listar categorias', erro)
        res.render('categoriasTelas/lista', {mensagem : erro})
    }
})

//Rota para abrir tela para criar uma nova categoria (c - create)
//Rota para acessar /categoria/novo
router.get('/novo', (req, res) => {
    res.render('categoriasTelas/criar')
})

router.post('/novo',  async (req, res) => {
    const { nome_categoria} = req.body 
    
    await BD.query('insert into categorias(nome_categoria) values ($1)', [nome_categoria])
    res.redirect('/categorias')
})

//(D- delete)
router.post('/:id/deletar', async (req, res) => {
    const {id} = req.params
    //const id = req.params.id 
    // await BD.query('delete from categorias where id_categoria = $1', [id])
    await BD.query("update categorias set inativo = 'S' where id_categoria = $1", [id])
    res.redirect('/categorias')
})

//(U - Update)
router.get('/:id/editar', async (req, res) => {
    const {id} = req.params
    //const id = req.params.id 
    const resultado = await BD.query('select * from categorias where id_categoria = $1', [id])
    console.log(resultado);
    
    res.render('categoriasTelas/editar', {categoria: resultado.rows[0]})
})

router.post('/:id/editar', async (req, res) => {
    const {id} = req.params
    const {nome_categoria} = req.body
    await BD.query('update categorias set nome_categoria = $1 where id_categoria = $2', [nome_categoria, id])
    res.redirect('/categorias')

})



module.exports = router