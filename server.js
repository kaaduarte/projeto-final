// server.js

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { listenerCount } = require('process');
const app = express();

// Conectando ao MongoDB
mongoose.connect('mongodb+srv://programacaoduarte:5kaSjFvlvYrKoTuw@cluster1.n3px2.mongodb.net/')
.then( () => console.log('Conectando ao MongoDB'))
.catch((err) => console.log ('Erro ao conectar ao MongoDB:', err));

// MiddLeware
app.use(cors());
app.use(bodyParser.json());

// configuração do multer para salvar as imagens no servidor
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde as imagens serão salvas
    },
    filename: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde as imagens serão salvas
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome único para cada arquivo
    }
});

const upload = multer({ storage: storage});

// Middleware para parsear JSON e permitir uploads
app.use(express.json());
app.use(express.static('uploads'));  // Torna a pasta 'uploads' pública para acessar as imagens

// Rota para adicionar um filme com a imagem
app.post('/api/filmes', upload.single('imagem'), async (req, res) => {
  const { nome, genero, ano } = req.body;
  const imagemUrl = req.file ? `/uploads/${req.file.filename}` : null;  // URL da imagem salva

  const filme = new Filme({
    nome,
    genero,
    ano,
    imagem: imagemUrl,
    avaliacoes: []
  });

  try {
    await filme.save();
    res.status(201).json(filme);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao adicionar filme' });
  }
});

// corrigindo erro JSON

if (response.ok) {
  try {
      const filme = await response.json();
      console.log("Filme adicionado com sucesso:", filme);
      document.getElementById('mensagem').innerHTML = `<p>Filme adicionado com sucesso: ${filme.nome}</p>`;
  } catch (error) {
      console.error("Erro ao parsear a resposta JSON:", error);
      document.getElementById('mensagem').innerHTML = `<p>Erro ao interpretar a resposta do servidor.</p>`;
  }
} else {
  const erro = await response.text();  // Usando text() para capturar resposta não JSON
  console.error("Erro ao adicionar filme:", erro);
  document.getElementById('mensagem').innerHTML = `<p>Erro ao adicionar filme: ${erro}</p>`;
}

// Função para carregar os filmes e exibir as imagens
async function carregarFilmes() {
    const response = await fetch('http://localhost:3000/api/filmes');
    const filmes = await response.json();
    const filmesLista = document.getElementById('filmes-lista');
    filmesLista.innerHTML = '';
  
    filmes.forEach(filme => {
      const divFilme = document.createElement('div');
      divFilme.classList.add('filme');
      
      divFilme.innerHTML = `
        <h3>${filme.nome} (${filme.ano})</h3>
        <p>Gênero: ${filme.genero}</p>
        <p><strong>Média:</strong> ${calcularMedia(filme.avaliacoes)}</p>
        ${filme.imagem ? `<img src="${filme.imagem}" alt="${filme.nome}" width="200" />` : ''}
        <button onclick="avaliarFilme('${filme._id}')">Avaliar</button>
      `;
      
      filmesLista.appendChild(divFilme);
    });
  }
  
  // Função para calcular a média de avaliações
  function calcularMedia(avaliacoes) {
    const total = avaliacoes.reduce((acc, curr) => acc + curr.nota, 0);
    return (total / avaliacoes.length).toFixed(1);
  }
  
  carregarFilmes();

app.post('/api/filmes', async (req, res) => {
    const { nome, genero, ano, julgamentos } = req.body; // Recebe os dados do filme

    // Cria um novo objeto filme com os dados fornecidos
    const filme = new Filme({
        nome,
        genero,
        ano,
        julgamentos: [julgamento] // Inicializa com o julgamento que você recebe 
    });

    try {
        // Salva o filme no banco de dados
        await filme.save();
        res.status(201).json(filme); // Retorna o filme recém-adicionado
    } catch (error) {
        res.status(400).json({ error: 'Erro ao adicionar filme'});
    }
});

// Modelo de Filme atualizado com gênero
const filmesSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    ano: { type: Number, required: true },
    genero: { type: String, required: true },  //gênero como campo existente
    imagem: { type: String }, // Novo campo para armazenar a URL da imagem
    julgamentos: [{
        nota: { type: Number, min: 0, x: 5 },
        comentario: { type: String }
}]
});

const Filme = mongoose.model('Filme', filmesSchema);

module.exports = Filme;

// Rota para obter todos os filmes
app.get('/api/filmes', async (req, res) => {
    const { id } = req.params;
    const { nota, comentario } = req.body;

    const filme = await Filme.findById(id);
    if (!filme) return res.status(404).send('Filme não encontrado');

    filme.avaliacoes.push({ nota, comentario });
    await filme.save();

    res.status(201).json(filme);
});

// Rota para obter filmes filtrados por gênero
app.get ('/api/filmes', async (req, res) => {
    const { genero, mediaMin } = req.query; // Recebe o gênero e média mínima como parâmetro na query string
    const query = genero ? { genero } : {}; // Filtra por gênero se for fornecido

    const filmes = await Filme.find(query); // Busca filmes com o filtro de gênero (se houver)

    //Filtra os filmes com base na média mínima
    const filmesFiltrados = filmes.filter(filme => {
        const media = filme.julgamentos.reduce((acc, curr) => acc + curr.nota, 0) / filme.julgamentos.length;
        return media >= (mediaMin || 0); // Se mediaMin não for fornecido, não filtra 
    });

    res.json(filmesFiltrados);
});

// Rota para julgar um filme
app.post('/api/filmes/:id/julgar', async (req, res) => {
    const { id } = req.params;
    const { nota, comentario } = req.body;

    const filme = await Filme.findById(id);
    if (!filme) return res.status(404).send('Filme não encontrado');

    filme.avaliacoes.push({ nota, comentario });
    await filme.save();

    res.status(201).json(filme);
});

// Rota para calcular a média das julgamentos
app.get('/api/filmes/:id/julgamentos', async (req, res) => {
    const { id } = req.params;

    const filme = await Filme.findById(id);
    if (!filme) return res.status(404).send('Filme não encontrado');

    const media = filme.julgamentos.reduce((acc, curr) => acc + curr.nota, 0) /filme.julgamentos.length;
    res.json({ media });
});

// Inicializando o servidor
const PORT = 3000
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);


 document.getElementById('form-adicionar-filme').addEventListener('submit', adicionarFilme);


});