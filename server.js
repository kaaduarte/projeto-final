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

app.post('/api/filmes', async (req, res) => {
    const { nome, genero, ano, julgamentos } = req.body; // Recebe os dados do filme

    // Cria u novo objeto filme com os dados fornecidos
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
});