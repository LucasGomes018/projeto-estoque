const express = require('express');
const router = express.Router();
const BD = require("../db")

// Rota principal do painel administrativo
router.get('/', async (req, res) => {
    //    views/landing/index.ejs
    const qProdutos = await BD.query('select count (*) as total_produtos from produtos');

    const qCategorias = await BD.query('select count (*) as total_categorias from categorias');

    const aEstoque = await BD.query('select count(*) as abaixo_estoque from produtos where estoque < estoque_min');

    const pCategorias = await BD.query(`select count(*) as total_produto_categoria, c.nome_categoria from produtos as p
	    inner join categorias as c on  p.id_categoria = c.id_categoria
        group by c.nome_categoria
    `);

    const EstoqueP = await BD.query(`select p.nome_produto, p.estoque from produtos as p
	group by p.nome_produto, p.estoque`);
    
    const tEstoque = await BD.query(`select sum(estoque * valor) as estoque from produtos`);
    const abaixoEstoqueT = await BD.query(`select p.imagem, p.nome_produto, ct.nome_categoria, p.estoque_min, p.estoque from produtos as p
            inner join categorias as ct on p.id_categoria = ct.id_categoria where p.estoque < p.estoque_min`);

    // const qValor = await BD.query('select count (*) as total_valores from ');

    res.render('admin/dashboard', {
        totalProdutos : qProdutos.rows[0].total_produtos,
        totalCategorias: qCategorias.rows[0].total_categorias,
        abaixoEstoque: aEstoque.rows[0].abaixo_estoque,
        produtosCategorias: pCategorias.rows,
        produtoEstoque: EstoqueP.rows,
        totalEstoque: tEstoque.rows[0].estoque.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'}),
        produtosAbaixoEstoque: abaixoEstoqueT.rows
        // totalValor: qValor.rows[0].total_valores
    })
})

module.exports = router;