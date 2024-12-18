// Middleware
app.use(cors());
app.use(express.json()); // Para fazer o parse do corpo da requisição

const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(cors({
  origin: '*', // Permite requisições de qualquer origem (ajuste conforme necessário)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

// Conexão com MongoDB
mongoose.connect('mongodb+srv://programacaoduarte:5kaSjFvlvYrKoTuw@cluster1.n3px2.mongodb.net/')
    .then(() => console.log('Conectado ao MongoDB'))
    .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Modelo Filme
const filmesSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  ano: { type: Number, required: true },
  genero: { type: String, required: true },
  imagem: { type: String },
  comentario: { type: String, trim: true },
  julgamentos: [{
    nota: { type: Number, min: 1, max: 5 },
    comentario: { type: String, trim: true }
  }]
});

const Filme = mongoose.model('Filme', filmesSchema);

// Rota POST: Adicionar um filme (agora sem o upload de imagem)
app.post('/api/filmes', async (req, res) => {
  console.log('Recebendo requisição POST para /api/filmes');
  console.log('Dados recebidos:', req.body);

  const { nome, genero, ano, imagem, comentario } = req.body;

  const filme = new Filme({
      nome,
      genero,
      ano,
      imagem,
      comentario,
      julgamentos: []
  });

  try {
      await filme.save();
      console.log('Filme salvo com sucesso:', filme);
      res.status(201).json(filme);
  } catch (error) {
      console.error('Erro ao salvar filme:', error);
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

// Função para calcular a média de julgamentos
function calcularMedia(julgamentos) {
  if (julgamentos.length === 0) return 0;
  const total = julgamentos.reduce((acc, curr) => acc + curr.nota, 0);
  return total / julgamentos.length;
}

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

module.exports = Filme;