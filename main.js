// Função para formatar a data atual
function obterDataFormatada() {
    const dataAtual = new Date();
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const ano = dataAtual.getFullYear();
    return mes + '-' + dia + '-' + ano;
}

// Função para carregar as moedas no seletor
async function carregarMoedas() {
    try {
        const resposta = await fetch("https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/Moedas?$top=100&$format=json&$select=simbolo,nomeFormatado,tipoMoeda");
        const moedas = await resposta.json();
        carregarSelectMoedas(moedas);
    } catch (erro) {
        console.error("Erro ao carregar moedas:", erro);
    }
}

// Função para carregar as moedas nos seletores
function carregarSelectMoedas(moedas) {
    const selectMoedasOrigem = document.getElementById("moedaOrigem");
    const selectMoedasDestino = document.getElementById("moedaDestino");

    for (const moeda of moedas.value) {
        const opcaoMoedaOrigem = new Option(moeda.nomeFormatado, moeda.simbolo);
        const opcaoMoedaDestino = new Option(moeda.nomeFormatado, moeda.simbolo);

        selectMoedasOrigem.appendChild(opcaoMoedaOrigem);
        selectMoedasDestino.appendChild(opcaoMoedaDestino);
    }
}

// Função para buscar cotação usando fetch
async function buscarCotacaoFETCH(moeda) {
    const resposta = await fetch("https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='" + moeda + "'&@dataCotacao='" + obterDataFormatada() + "'&$top=100&$format=json&$select=cotacaoCompra,cotacaoVenda,tipoBoletim");
    const enderecoOBJ = await resposta.json();
    const indiceAbertura = enderecoOBJ.value[0];
    return indiceAbertura;
}


// Função principal de conversão
async function converterMoeda() {
    try {
        const moedaDe = document.getElementById('moedaOrigem');
        const moedaPara = document.getElementById('moedaDestino');
        const valorInput = document.getElementById('valor');
        const resultadoSpan = document.getElementById('resultado');
        const taxaCambioSpan = document.getElementById('taxaCambio');

        if (!moedaDe || !moedaPara || !valorInput || !resultadoSpan || !taxaCambioSpan) {
            console.error('Elementos HTML não encontrados.');
            return;
        }

        const moedaDeValor = moedaDe.value;
        const moedaParaValor = moedaPara.value;
        const valor = Number(valorInput.value);

        if (moedaDeValor === moedaParaValor) {
            console.error('Moeda de origem e destino são iguais.');
            return;
        }

        const operacao = moedaParaValor === 'BRL' ? 'vender' : 'comprar';

        const cotacaoDe = moedaDeValor === 'BRL' ? 1 : (await buscarCotacaoFETCH(moedaDeValor))[operacao === 'comprar' ? 'cotacaoVenda' : 'cotacaoCompra'];
        const cotacaoPara = moedaParaValor === 'BRL' ? 1 : (await buscarCotacaoFETCH(moedaParaValor))[operacao === 'comprar' ? 'cotacaoCompra' : 'cotacaoVenda'];

        const cotacaoFinal = cotacaoDe * valor / cotacaoPara;

        resultadoSpan.innerText = `${moedaParaValor} ${cotacaoFinal.toFixed(2)}`;
        taxaCambioSpan.innerText = operacao === 'comprar' ? `Taxa de Compra: ${cotacaoDe}` : `Taxa de Venda: ${cotacaoDe}`;
    } catch (erro) {
        console.error("Erro ao converter moeda:", erro);
    }
}

// Evento de clique no botão de cálculo
document.getElementById('idBtCalcularCotacao').addEventListener('click', converterMoeda);

// Carregar moedas ao iniciar
carregarMoedas();
