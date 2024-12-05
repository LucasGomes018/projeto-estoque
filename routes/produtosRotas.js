const express = require('express')
const router = express.Router()
const BD = require('../db')
const { put, del } = require("@vercel/blob");

const enviarFoto = async (file) => {
    const fileBuffer = file.data
    const originalName = file.name
    const blob = await put(originalName, fileBuffer, {
        access: "public", // Define acesso público ao arquivo
    });
    console.log(`Arquivo enviado com sucesso! URL: ${blob.url}`);
    return blob.url;
};



const excluirFoto = async (imagemUrl) => {
    const nomeArquivo = imagemUrl.split("/").pop();
    if (nomeArquivo) {
        await del(nomeArquivo);
        console.log(`Arquivo ${nomeArquivo} excluído com sucesso.`);
    }
}

//Listar produtos (R - Read)
//Rota localhost:3000/disciplinas/
router.get('/', async (req, res) => {
    try {
        const busca = req.query.busca || ''
        const ordenar =  req.query.ordenar || 'nome_produto'
        const pg = req.query.pg || 1; // Obtendo a página de dados

        const limite = 8; // número de registros por página
        const offset = (pg - 1) * limite; // Qntd de registros que quero "pular"

        const buscaDados = await BD.query(` 
            select p.id_produto, p.nome_produto, p.valor, p.estoque, p.estoque_min, p.imagem, c.nome_categoria
                from produtos as p left join categorias as c on p.id_categoria = c.id_categoria
                where upper(p.nome_produto) like $1 or upper(c.nome_categoria) like $1
                order by ${ordenar} limit $2 offset $3`,  [`%${busca.toUpperCase()}%`, limite, offset])

        const totalItens = await BD.query(` 
            select count(*) as total
                from produtos as p left join categorias as c on p.id_categoria = c.id_categoria
                where upper(p.nome_produto) like $1 or upper(c.nome_categoria) like $1`, [`%${busca.toUpperCase()}%`])

        const totalPgs = Math.ceil(totalItens.rows[0].total / limite);

        res.render('produtosTelas/lista', {
            vetorDados: buscaDados.rows,
            busca : busca,
            ordenar : ordenar,
            pgAtual: parseInt(pg),
            totalPgs: totalPgs})

    } catch ( erro ) {
        console.log('Erro ao listar produtos', erro)
        res.render('produtosTelas/lista', {mensagem : erro})
    }
})



//(C - Create)
//Para acessar localhost:3000/produtos/novo
router.get('/novo', async (req, res) => {
    try {
        const resultado = await BD.query('select * from categorias order by nome_categoria')

        res.render('produtosTelas/criar', {categoriasCadastradas: resultado.rows})

    } catch ( erro ) {
        console.log('Erro ao listar produtos', erro)
        res.render('produtosTelas/lista', {mensagem : erro})
    }
})

router.post('/novo', async (req, res) => {
    try {
        const urlImagem = await enviarFoto(req.files.file);
        const {nome_produto, valor, estoque, estoque_min, id_categoria} = req.body
        await BD.query('insert into produtos (nome_produto, valor, estoque, estoque_min, id_categoria, imagem) values ($1, $2, $3, $4, $5, $6)', [nome_produto, valor, estoque, estoque_min, id_categoria, urlImagem])
        
        //Redirecionando para a tela de consulta de disciplina
        res.redirect('/produtos')

    } catch ( erro ) {
        console.log('Erro ao listar disciplinas', erro)
        res.render('produtosTelas/lista', {mensagem : erro})
    }
})

// (D- delete)


router.post('/:id/deletar', async (req, res) => {
    const urlImagem = await excluirFoto(req.files.file);

    const {id} = req.params
    //const id = req.params.id 
    await BD.query('delete from produtos where id_produto = $1', [id])
    res.redirect('/produtos')
})

// (U - Update)
router.get('/:id/editar', async(req, res) => {
    try{
        const {id} = req.params
        const resultado = await BD.query('select * from produtos where id_produto = $1', [id])
        
        const catCadastrados = await BD.query('select * from categorias order by nome_categoria')

        const movimentacoes = await BD.query(`
            select *, TO_CHAR(data_movimentacao, 'DD/MM/YYYY') AS data from movimentacoes where id_produto = $1 order by id_movimentacao`, [id])

        res.render('produtosTelas/editar', {
            produto: resultado.rows[0],
            categoriasCadastradas: catCadastrados.rows,
            movimentacoes: movimentacoes.rows
        })

    } catch (erro) {
        console.log('Erro ao editar produto', erro)
   
    }
})

router.post('/:id/editar', async(req, res) => {
    try{
        const { id } = req.params
        const {nome_produto, valor, estoque, estoque_min, id_categoria, imagem} = req.body

        let urlImagem = imagem
        if (req.files) {
            excluirFoto(urlImagem)
            urlImagem = await enviarFoto(req.files.file)[""]
        }
        await BD.query(`update produtos set nome_produto = $1, valor = $2, estoque = $3, estoque_min = $4,
             id_categoria = $5, imagem = $6 where id_produto = $7`,
            [nome_produto, valor, estoque, estoque_min, id_categoria, imagem, id])
        res.redirect('/produtos')
    
        }catch (erro) {
            console.log('Erro ao editar produto', erro)
        }

})

//Lançar Movimentação
router.post('/:id/lancar-movimentacao', async(req, res) => {
    try{
        const { id } = req.params
        const { tipo_movimentacao, data_movimentacao, quantidade, descricao } = req.body
        const id_usuario = req.session.idUsuario
          // Passa a data atual do servidor para a view
        await BD.query(`insert into movimentacoes
                        (tipo_movimentacao,data_movimentacao,quantidade,descricao,id_produto, id_usuario) values
                        ($1, $2, $3, $4, $5, $6)
            `, [tipo_movimentacao,data_movimentacao,quantidade,descricao,id,id_usuario])
        res.redirect(`/produtos/${id}/editar`)

    }catch (erro) {
        console.log('Erro ao lançar MOVIMENTAÇÃO', erro)
    }

})



module.exports = router