// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { listenerCount } = require('process');

const app = express();

// MiddLeware
app.use(cors());
app.use(bodyParser.json());


// Conectando ao MongoDB
mongoose.connect('mongodb+srv://programacaoduarte:5kaSjFvlvYrKoTuw@cluster1.n3px2.mongodb.net/')
.then( () => console.log('Conectando ao MongoDB'))
.catch((err) => console.log ('Erro ao conectar ao MongoDB:', err));

// Modelo de Filme atualizado com categoria
const filmesSchema = new mongoose.Schema({
    nome: String,
    ano: Number,
    genero: String,  //gênero como campo existente
    categoria: String, // Nova categoria
    avaliacoes: [{ 
        nota: Number, 
        comentario: String
    }]
});

const Filme = mongoose.model('Filme', filmesSchema);

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

// Rota para obter filmes filtrados por categoria
app.get('/api/filmes/categoria/:categoria', async (req, res) => {
    const { categoria } = req.params;
    const filmes = await Filme.find({ categoria: categoria });

    if (filmes.length === 0) {}
})

// Rota para avaliar um filme
app.post('/api/filmes/:id/avaliar', async (req, res) => {
    const { id } = req.params;
    const { nota, comentario } = req.body;

    const filme = await Filme.findById(id);
    if (!filme) return res.status(404).send('Filme não encontrado');

    filme.avaliacoes.push({ nota, comentario });
    await filme.save();

    res.status(201).json(filme);
});

// Rota para calcular a média das avaliações
app.get('/api/filmes/:id/avaliacao', async (req, res) => {
    const { id } = req.params;

    const filme = await Filme.findById(id);
    if (!filme) return res.status(404).send('Filme não encontrado');

    const media = filme.avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) /filme.avaliacoes.length;
    res.json({ media });
});

// Inicializando o servidor
const PORT = 3000
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});