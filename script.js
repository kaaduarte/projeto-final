
const API_BASE_URL = 'http://localhost:3000';

// Função para adicionar um filme
async function adicionarFilme(event) {
    event.preventDefault();  // Previne o comportamento padrão de envio do formulário

    console.log("Função adicionarFilme foi chamada!"); // Mensagem para depuração

    // Coleta os dados do formulário
    const nome = document.getElementById('nome').value;
    const genero = document.getElementById('genero').value;
    const ano = document.getElementById('ano').value;
    const nota = document.getElementById('nota').value;
    const imagem = document.getElementById('imagem').value; // Agora é uma URL, não um arquivo
    const comentario = document.getElementById('comentario').value;

    console.log({ nome, genero, ano, nota, imagem }); // Verifica os valores coletados

    // Cria um objeto com os dados
    const filmeData = {
        nome,
        genero,
        ano,
        nota,
        imagem,  // A URL da imagem é agora um campo do tipo string
        comentario,
    };

    try {
        const response = await fetch('/api/filmes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filmeData)
        });        

        console.log("Resposta do servidor:", response);

        if (response.ok) {
            const filme = await response.json();
            console.log("Filme adicionado com sucesso:", filme);
            document.getElementById('mensagem').innerHTML = `<p>Filme adicionado com sucesso: ${filme.nome}</p>`;
        } else {
            const erro = await response.json();
            console.error("Erro ao adicionar filme:", erro);
            document.getElementById('mensagem').innerHTML = `<p>Erro ao adicionar filme: ${erro.error}</p>`;
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        document.getElementById('mensagem').innerHTML = `<p>Erro na requisição: ${error}</p>`;
    }
}

// Adiciona o evento de envio do formulário
document.getElementById('form-adicionar-filme').addEventListener('submit', adicionarFilme);

function exibirFilmes(filmes) {
    const filmesLista = document.getElementById('filmes-lista');
    filmesLista.innerHTML = '';
    filmes.forEach(filme => {
        const divFilme = document.createElement('div');
        divFilme.classList.add('filme');
        divFilme.innerHTML = `
            <h3>${filme.nome} (${filme.ano})</h3>
            <p>Gênero: ${filme.genero}</p>
            ${filme.imagem ? `<img src="${filme.imagem}" alt="${filme.nome}" width="200" />` : ''}
            ${filme.comentario ? `<p><strong>Comentário:</strong> ${filme.comentario}</p>` : ''}
            <button onclick="julgarFilme('${filme._id}')">Julgar</button>
            <p><strong>Média:</strong> ${calcularMedia(filme.julgamentos)}</p>
        `;
        filmesLista.appendChild(divFilme);
    });
}

// Função para calcular média de julgamento
function calcularMedia(julgamento) {
    if (!Array.isArray(julgamento) || julgamento.length === 0) return 'Sem julgamento';
    const total = julgamento.reduce((acc, a) => acc + a.nota, 0);
    return (total / julgamento.length).toFixed(1);
}

async function filtrarFilmes() {
    const genero = document.getElementById('genero').value;
    const mediaMin = document.getElementById('mediaMin').value;
    await carregarFilmes(genero, mediaMin); // Passa o gênero e a média mínima para o back-end
}

async function carregarFilmes(genero = '', mediaMin = '') {
    const url = `/api/filmes?genero=${genero}&mediaMin=${mediaMin}`;
    const response = await fetch(url);
    const filmes = await response.json();
    exibirFilmes(filmes);
}

// Função para julgar um filme
async function julgarFilme(id) {
    const nota = prompt('Dê uma nota de 1 a 5:');
    const comentario = prompt('Deixe um comentário:');

    const response = await fetch(`http://localhost:3000/api/filmes/${id}/julgar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota: Number(nota), comentario })
    });

    if (response.ok) {
        alert('Julgamento anotado!');
        carregarFilmes(); // Recarrega a lista de filmes
    } else {
        alert('Erro ao registrar julgamento');
    }
}