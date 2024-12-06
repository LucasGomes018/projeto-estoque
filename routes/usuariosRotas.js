const express = require("express");
const router = express.Router();
const BD = require("../db");
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
  try{
  const urlImagem = await enviarFoto(req.files.file);

  const { nome, usuario, senha } = req.body;

  await BD.query(
    "insert into usuarios(nome, usuario, senha, imagem) values ($1, $2, $3, $4)",
    [nome, usuario, senha, urlImagem]
  );
  res.redirect("/usuarios");
  } catch (erro) {
    console.log('Erro ao listar produtos', erro)
    res.render('produtosTelas/lista', {mensagem : erro})
  }
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

    let urlImagem = imagem
    if (req.files) {
        excluirFoto(urlImagem)
        urlImagem = await enviarFoto(req.files.file)
    }

    await BD.query(
      `update usuarios
            set nome = $1, usuario = $2, imagem = $3
            where id_usuario = $4`,
      [nome, usuario, urlImagem, id]
    );
    res.redirect("/usuarios/");
  } catch (erro) {
    console.log("Erro ao gravar usuario", erro);
  }
});

module.exports = router;
