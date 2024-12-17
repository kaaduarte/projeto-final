const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Conexão com MongoDB
mongoose.connect('mongodb+srv://programacaoduarte:5kaSjFvlvYrKoTuw@cluster1.n3px2.mongodb.net/')
    .then(() => console.log('Conectado ao MongoDB'))
    .catch((err) => console.log('Erro ao conectar ao MongoDB:', err));

// Middleware
app.use(cors());
app.use(express.json()); // Para fazer o parse do corpo da requisição


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

// Rota POST: Adicionar um filme (agora sem o upload de imagem)
app.post('/api/filmes', async (req, res) => {
  const { nome, genero, ano, imagem } = req.body; // Agora esperamos que a imagem seja uma URL

  const filme = new Filme({ nome, genero, ano, imagem, julgamentos: [] });
  
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

// Rota GET: Obter todos os filmes
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
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

module.exports = Filme;

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