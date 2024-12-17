const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();

// Conexão com MongoDB
mongoose.connect('mongodb+srv://programacaoduarte:5kaSjFvlvYrKoTuw@cluster1.n3px2.mongodb.net/')
    .then(() => console.log('Conectado ao MongoDB'))
    .catch((err) => console.log('Erro ao conectar ao MongoDB:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads')); // Pasta pública para acessar as imagens

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Modelo Filme
const filmesSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  ano: { type: Number, required: true },
  genero: { type: String, required: true },
  imagem: { type: String },
  julgamentos: [{
      nota: { type: Number, min: 1, max: 5 },
      comentario: { type: String }
  }]
});

const Filme = mongoose.model('Filme', filmesSchema);

// Rota POST: Adicionar um filme
app.post('/api/filmes', upload.single('imagem'), async (req, res) => {
  const { nome, genero, ano } = req.body;
  const imagemUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const filme = new Filme({ nome, genero, ano, imagem: imagemUrl, julgamentos: [] });
  try {
      await filme.save();
      res.status(201).json(filme);
  } catch (error) {
      res.status(400).json({ error: 'Erro ao adicionar filme' });
  }
});

/* app.post('/api/filmes', async (req, res) => {
  const { nome, genero, ano, julgamentos } = req.body; // Recebe os dados do filme

  // Cria um novo objeto filme com os dados fornecidos
  const filme = new Filme({
      nome,
      genero,
      ano,
      julgamentos: [julgamentos] // Inicializa com o julgamentos que você recebe 
  });

  try {
      // Salva o filme no banco de dados
      await filme.save();
      res.status(201).json(filme); // Retorna o filme recém-adicionado
  } catch (error) {
      res.status(400).json({ error: 'Erro ao adicionar filme'});
  }
}); */

// Rota GET: Obter todos os filmes (com filtro de gênero e média mínima)
app.get('/api/filmes', async (req, res) => {
  const { genero, mediaMin } = req.query;

  let query = genero ? { genero } : {};
  const filmes = await Filme.find(query);

  const filmesFiltrados = filmes.filter(filme => {
      if (filme.julgamentos.length === 0) return true;
      const media = filme.julgamentos.reduce((acc, curr) => acc + curr.nota, 0) / filme.julgamentos.length;
      return media >= (mediaMin || 0);
  });

  res.json(filmesFiltrados);
});

// Inicialização do servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

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
        <p><strong>Média:</strong> ${calcularMedia(filme.julgamentos)}</p>
        ${filme.imagem ? `<img src="${filme.imagem}" alt="${filme.nome}" width="200" />` : ''}
        <button onclick="avaliarFilme('${filme._id}')">Avaliar</button>
      `;
      
      filmesLista.appendChild(divFilme);
    });
  }
  
  // Função para calcular a média de julgamentos
  function calcularMedia(julgamentos) {
    const total = julgamentos.reduce((acc, curr) => acc + curr.nota, 0);
    return (total / julgamentos.length).toFixed(1);
  }

module.exports = Filme;

// Rota para julgar um filme
app.post('/api/filmes/:id/julgar', async (req, res) => {
    const { id } = req.params;
    const { nota, comentario } = req.body;

    const filme = await Filme.findById(id);
    if (!filme) return res.status(404).send('Filme não encontrado');

    filme.julgamentos.push({ nota, comentario });
    await filme.save();

    res.status(201).json(filme);
});

// Rota para calcular a média das julgamentos
app.get('/api/filmes/:id/julgamentos', async (req, res) => {
  const { id } = req.params;

  const filme = await Filme.findById(id);
  if (!filme) return res.status(404).send('Filme não encontrado');

  if (filme.julgamentos.length === 0) return res.status(200).json({ media: 'Sem avaliações' });

  const media = filme.julgamentos.reduce((acc, curr) => acc + curr.nota, 0) / filme.julgamentos.length;
  res.json({ media: media.toFixed(1) });
});