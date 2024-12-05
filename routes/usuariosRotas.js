const express = require("express");
const router = express.Router();
const BD = require("../db");

//Listar categorias (R - Read)
//Rota localhost:3000/usuarios/
router.get("/", async (req, res) => {
  try {
    const busca = req.query.busca || "";
    const ordenar = req.query.ordenar || "nome";
    const pg = req.query.pg || 1; // Obtendo a página de dados

    const limite = 4; // número de registros por página
    const offset = (pg - 1) * limite; // Qntd de registros que quero "pular"

    const buscaDados = await BD.query(
      ` SELECT * FROM usuarios 
            where upper(usuarios.nome) like $1 or upper(usuarios.usuario) like $1 ORDER BY ${ordenar}
            limit $2 offset $3`, [`%${busca.toUpperCase()}%`, limite, offset]);

    const totalItens = await BD.query(
      ` SELECT count(*) as total from usuarios 
            where upper(usuarios.nome) like $1 or upper(usuarios.usuario) like $1`,
      [`%${busca.toUpperCase()}%`]
    );

    const totalPgs = Math.ceil(totalItens.rows[0].total / limite);
    
    res.render("usuariosTelas/lista", {
      vetorDados: buscaDados.rows,
      busca: busca,
      ordenar: ordenar,
      pgAtual: parseInt(pg),
      totalPgs: totalPgs
    });
  } catch (erro) {
    console.log("Erro ao listar usuarios", erro);
    res.render("usuariosTelas/lista", { mensagem: erro });
  }
});

//Rota para abrir tela para criar uma nova categoria (c - create)
//Rota para acessar /categoria/novo
router.get("/novo", (req, res) => {
  res.render("usuariosTelas/criar");
});

router.post("/novo", async (req, res) => {
  const { nome, usuario, senha } = req.body;

  await BD.query(
    "insert into usuarios(nome, usuario, senha) values ($1, $2, $3)",
    [nome, usuario, senha]
  );
  res.redirect("/usuarios");
});

// (D- delete)
router.post("/:id/deletar", async (req, res) => {
  const { id } = req.params;
  //const id = req.params.id
  await BD.query("delete from usuarios where id_usuario = $1", [id]);
  res.redirect("/usuarios");
});

// (U - Update)
router.get("/:id/editar", async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await BD.query(
      "select * from usuarios where id_usuario = $1",
      [id]
    );

    res.render("usuariosTelas/editar", {
      usuario: resultado.rows[0],
    });
  } catch (erro) {
    console.log("Erro ao editar usuario", erro);
  }
});

router.post("/:id/editar", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, usuario, imagem } = req.body;
    await BD.query(
      `update usuarios
            set nome = $1, usuario = $2, imagem = $3
            where id_usuario = $4`,
      [nome, usuario, imagem, id]
    );
    res.redirect("/usuarios/");
  } catch (erro) {
    console.log("Erro ao gravar usuario", erro);
  }
});

module.exports = router;
