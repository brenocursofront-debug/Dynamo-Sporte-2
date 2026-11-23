// ==========================================================================
// DYNAMO SPORTS - JAVASCRIPT SIMPLES, LIMPO E 100% COMENTADO
// ==========================================================================
// Olá! Este arquivo controla tudo o que se mexe ou responde a cliques no site.
// Ele foi feito em JavaScript puro (Vanilla JS), sem firulas ou códigos difíceis.
// 
// O QUE ESTE ARQUIVO FAZ:
// 1. Abre e fecha o menu no celular.
// 2. Filtra os produtos por categoria (Camisetas, Shorts, Acessórios).
// 3. Adiciona e remove peças do carrinho de compras.
// 4. Calcula o total em reais (R$) e as horas de esporte comunitário geradas.
// 5. Salva os itens no seu navegador (LocalStorage) para não sumir no F5.
// 6. Confirma a reserva nas aulas gratuitas.
// 7. Mostra avisos visuais rápidos na tela (Toast).
// 8. Faz os elementos surgirem suavemente conforme a página é rolada.
// ==========================================================================


// ==========================================================================
// PASSO 1: SELECIONAR OS ELEMENTOS DO SITE QUE VAMOS USAR
// ==========================================================================
// Aqui guardamos em variáveis (const) as partes do HTML que vamos precisar
// monitorar ou alterar (botões, listas, textos, etc).

// Elementos do Cabeçalho e Menu
const topo = document.getElementById("topo");                    // Barra superior fixa
const menu = document.getElementById("menu");                    // Lista de links do menu
const botaoMenu = document.getElementById("botaoMenu");          // Botão de 3 linhas (celular)

// Elementos do Carrinho
const carrinho = document.getElementById("carrinho");            // Painel lateral do carrinho
const botaoCarrinho = document.getElementById("botaoCarrinho");  // Botão com ícone de sacola no topo
const fecharCarrinho = document.getElementById("fecharCarrinho");// Botão 'X' para fechar o carrinho
const overlay = document.getElementById("overlay");              // Fundo escuro atrás do carrinho aberto
const listaCarrinho = document.getElementById("listaCarrinho");  // Onde os produtos entram na lista
const carrinhoVazio = document.getElementById("carrinhoVazio");  // Mensagem "Seu carrinho está vazio"
const contador = document.getElementById("contadorCarrinho");    // Bolinha com o número de itens
const totalCarrinho = document.getElementById("totalCarrinho");  // Texto do valor total em R$
const horasCarrinho = document.getElementById("horasCarrinho");  // Texto das horas de esporte financiadas
const horasCarrinhoContainer = document.getElementById("horasCarrinhoContainer"); // Caixa verde das horas
const botaoFinalizar = document.getElementById("finalizar");      // Botão "Finalizar compra"

// Notificação rápida na tela
const aviso = document.getElementById("avisoFlutuante");


// ==========================================================================
// PASSO 2: DADOS DO CARRINHO (MEMÓRIA NO NAVEGADOR)
// ==========================================================================
// O LocalStorage é como uma gaveta do navegador. Quando o cliente fecha ou
// recarrega a página, os itens dele continuam lá guardados!
let itens = JSON.parse(localStorage.getItem("dynamoCarrinho") || "[]");

// Desenho do ícone de lixeira em SVG (para o botão de remover)
const ICONE_LIXEIRA =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>';


// ==========================================================================
// PASSO 3: FUNÇÕES DE AJUDA (Auxiliares)
// ==========================================================================

/*
 * formatarPreco(valor)
 * Transforma números simples como 89.9 em formato brasileiro: "R$ 89,90"
 */
function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

/*
 * mostrarAviso(texto)
 * Exibe aquele balãozinho preto no pé da tela com uma mensagem rápida
 * e depois de 3 segundos esconde ele sozinho.
 */
let temporizadorAviso;
function mostrarAviso(texto) {
  // Limpa o tempo anterior para não bugar se clicar várias vezes seguidas
  clearTimeout(temporizadorAviso);

  // Monta o aviso sem innerHTML; o emoji é decorativo (aria-hidden) para o
  // leitor de tela não ler "faísca". O <output> já anuncia o texto sozinho.
  aviso.textContent = "";
  const caixa = document.createElement("span");
  const enfeite = document.createElement("span");
  enfeite.setAttribute("aria-hidden", "true");
  enfeite.textContent = "✨ ";
  caixa.appendChild(enfeite);
  caixa.appendChild(document.createTextNode(texto));
  aviso.appendChild(caixa);
  aviso.classList.add("visivel");

  // Tempo na tela: o painel de acessibilidade pode aumentar (window.dynamoDuracaoAviso)
  temporizadorAviso = setTimeout(function () {
    aviso.classList.remove("visivel");
  }, window.dynamoDuracaoAviso || 2800);
}
window.mostrarAviso = mostrarAviso; // usado pelo login e pela acessibilidade

/*
 * animarContador()
 * Dá um pequeno "pulo" no número do carrinho quando você adiciona uma peça.
 */
function animarContador() {
  contador.classList.remove("contador--animado");
  void contador.offsetWidth; // Pequeno truque que reinicia a animação CSS
  contador.classList.add("contador--animado");
}


// ==========================================================================
// PASSO 4: ATUALIZAR O CARRINHO NA TELA
// ==========================================================================
/*
 * atualizarCarrinho()
 * Esta é a função principal do carrinho! Ela:
 * 1. Salva a lista atualizada no LocalStorage.
 * 2. Limpa a lista visual antiga.
 * 3. Desenha cada produto que está dentro do carrinho.
 * 4. Calcula a soma dos preços e o total de horas/minutos gerados.
 * 5. Mostra ou esconde a mensagem de carrinho vazio.
 */
function atualizarCarrinho() {
  // 1. Salva no navegador em formato de texto JSON
  localStorage.setItem("dynamoCarrinho", JSON.stringify(itens));

  // 2. Limpa o HTML antigo da lista para desenhar do zero
  listaCarrinho.innerHTML = "";

  let valorTotal = 0;
  let minutosTotais = 0;

  // 3. Passa por cada produto que foi adicionado
  itens.forEach(function (item, posicao) {
    valorTotal += item.preco;
    minutosTotais += item.minutos;

    // Cria a linha (li) do produto
    const li = document.createElement("li");
    li.className = "carrinho__item";

    // Cria o texto com o nome do produto e o preço
    const info = document.createElement("span");
    info.textContent = item.nome;

    const precoTexto = document.createElement("small");
    precoTexto.textContent = formatarPreco(item.preco);
    info.appendChild(document.createElement("br"));
    info.appendChild(precoTexto);

    // Cria o botão de lixeira para remover este item
    const botaoRemover = document.createElement("button");
    botaoRemover.className = "carrinho__remover";
    botaoRemover.dataset.posicao = posicao; // Guarda a posição (0, 1, 2...)
    botaoRemover.setAttribute("aria-label", "Remover " + item.nome);
    botaoRemover.setAttribute("title", "Remover do carrinho");
    botaoRemover.innerHTML = ICONE_LIXEIRA;

    // Junta tudo dentro da linha e adiciona na lista
    li.appendChild(info);
    li.appendChild(botaoRemover);
    listaCarrinho.appendChild(li);
  });

  // 4. Atualiza os números no topo e no rodapé do carrinho
  contador.textContent = itens.length;
  botaoCarrinho.setAttribute(
    "aria-label",
    "Abrir carrinho, " + itens.length + (itens.length === 1 ? " item" : " itens")
  );
  totalCarrinho.textContent = formatarPreco(valorTotal);

  // Se tiver produtos, esconde o aviso de carrinho vazio
  if (itens.length > 0) {
    carrinhoVazio.classList.add("escondido");
  } else {
    carrinhoVazio.classList.remove("escondido");
  }

  // 5. Exibe as horas comunitárias geradas por essas compras
  if (horasCarrinhoContainer) {
    if (minutosTotais > 0) {
      horasCarrinhoContainer.style.display = "flex";
      const horasFormatadas = (minutosTotais / 60).toFixed(1).replace(".", ",");
      horasCarrinho.textContent = "Financia " + horasFormatadas + " h de esporte gratuito";
    } else {
      horasCarrinhoContainer.style.display = "none";
    }
  }
}


// ==========================================================================
// PASSO 5: ABRIR E FECHAR O CARRINHO LATERAL
// ==========================================================================
// Partes da página que ficam "inertes" (sem foco/clique/leitura) com o carrinho aberto.
// Assim o teclado e o leitor de tela não escapam para o fundo.
const PARTES_DE_FUNDO = ".pular, .barra-oferta, .topo, main, .rodape, .whatsapp-flutuante";

function travarFundo(travar) {
  document.querySelectorAll(PARTES_DE_FUNDO).forEach(function (parte) {
    if (travar) parte.setAttribute("inert", "");
    else parte.removeAttribute("inert");
  });
}

function abrirCarrinho() {
  carrinho.removeAttribute("inert");
  travarFundo(true);
  carrinho.classList.add("aberto");
  overlay.classList.add("visivel");
  botaoCarrinho.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden"; // Trava a rolagem da página atrás
  fecharCarrinho.focus();                  // Foco vai para dentro do carrinho
}

function fecharPainelCarrinho() {
  const estavaAberto = carrinho.classList.contains("aberto");
  carrinho.classList.remove("aberto");
  carrinho.setAttribute("inert", "");
  travarFundo(false);
  overlay.classList.remove("visivel");
  botaoCarrinho.setAttribute("aria-expanded", "false");
  document.body.style.overflow = ""; // Libera a rolagem da página
  if (estavaAberto) botaoCarrinho.focus(); // Devolve o foco ao botão que abriu
}

// Deixa a função acessível caso seja chamada direto pelo botão no HTML
window.fecharPainelCarrinho = fecharPainelCarrinho;

// Cliques para abrir e fechar
botaoCarrinho.addEventListener("click", abrirCarrinho);
fecharCarrinho.addEventListener("click", fecharPainelCarrinho);
overlay.addEventListener("click", fecharPainelCarrinho);

// Se a pessoa apertar a tecla ESC no teclado, fecha o carrinho e o menu
document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape") {
    fecharPainelCarrinho();
    if (menu) menu.classList.remove("aberto");
    if (botaoMenu) {
      botaoMenu.setAttribute("aria-expanded", "false");
      botaoMenu.setAttribute("aria-label", "Abrir menu");
    }
  }
});


// ==========================================================================
// PASSO 6: ADICIONAR PRODUTOS AO CARRINHO
// ==========================================================================
// Procura todos os botões "Adicionar ao carrinho" dentro da loja
const botoesAdicionar = document.querySelectorAll(".produto [data-preco]");

botoesAdicionar.forEach(function (botao) {
  botao.addEventListener("click", function () {
    // Pega as informações guardadas nas propriedades 'data-' do botão
    const nome = botao.dataset.nome;
    const preco = Number(botao.dataset.preco);
    const minutos = Number(botao.dataset.minutos);

    // Coloca o novo item na nossa lista
    itens.push({
      nome: nome,
      preco: preco,
      minutos: minutos
    });

    // Atualiza a tela e anima o contador
    atualizarCarrinho();
    animarContador();

    // Dá um retorno visual no botão para mostrar que deu certo!
    const textoOriginal = botao.textContent;
    botao.textContent = "Adicionado! ✓";
    botao.style.backgroundColor = "#244d32";

    setTimeout(function () {
      botao.textContent = textoOriginal;
      botao.style.backgroundColor = "";
    }, 1200);

    // Mensagem de aviso na tela
    mostrarAviso(nome + " adicionado ao carrinho!");
  });
});


// ==========================================================================
// PASSO 7: REMOVER PRODUTO DO CARRINHO (LIXEIRA)
// ==========================================================================
listaCarrinho.addEventListener("click", function (evento) {
  // Verifica se o clique foi no botão de lixeira
  const botaoRemover = evento.target.closest(".carrinho__remover");

  if (botaoRemover) {
    const posicao = Number(botaoRemover.dataset.posicao);
    const itemRemovido = itens[posicao];

    // Remove 1 item da lista naquela posição
    itens.splice(posicao, 1);

    // Atualiza a tela
    atualizarCarrinho();
    animarContador();

    if (itemRemovido) {
      mostrarAviso(itemRemovido.nome + " removido.");
    }

    // Mantém o foco dentro do carrinho (senão ele "some" para quem usa teclado)
    const proximo = listaCarrinho.querySelectorAll(".carrinho__remover")[posicao] ||
                    listaCarrinho.querySelector(".carrinho__remover:last-of-type");
    (proximo || fecharCarrinho).focus();
  }
});


// ==========================================================================
// PASSO 8: FINALIZAR COMPRA (SIMULAÇÃO EDUCATIVA)
// ==========================================================================
if (botaoFinalizar) {
  botaoFinalizar.addEventListener("click", function () {
    if (itens.length === 0) {
      mostrarAviso("Seu carrinho está vazio. Escolha uma peça primeiro!");
      return;
    }

    // Compra só com conta: abre o login e, ao entrar, reabre o carrinho
    if (window.DynamoLogin && !window.DynamoLogin.logado()) {
      fecharPainelCarrinho();
      mostrarAviso("Entre na sua conta para finalizar a compra.");
      window.DynamoLogin.abrir("login", abrirCarrinho);
      return;
    }

    // Esvazia o carrinho e atualiza tudo
    itens = [];
    atualizarCarrinho();
    fecharPainelCarrinho();
    mostrarAviso("Pedido simulado com sucesso! Obrigado por apoiar o esporte comunitário!");
  });
}


// ==========================================================================
// PASSO 9: FILTRAR OS PRODUTOS POR CATEGORIA
// ==========================================================================
// Quando o usuário clica em "Camisetas", "Shorts" ou "Acessórios",
// a gente esconde os outros e mostra apenas os daquela categoria.
const botoesFiltro = document.querySelectorAll(".filtro");
const cardsProdutos = document.querySelectorAll(".produto");
const statusFiltro = document.getElementById("statusFiltro"); // texto lido pelo leitor de tela

// Estado inicial: o botão "ativo" está pressionado
botoesFiltro.forEach(function (b) {
  b.setAttribute("aria-pressed", b.classList.contains("ativo") ? "true" : "false");
});

botoesFiltro.forEach(function (botao) {
  botao.addEventListener("click", function () {
    // 1. Tira a classe 'ativo' de todos os botões e coloca no que foi clicado
    botoesFiltro.forEach(function (b) {
      b.classList.remove("ativo");
      b.setAttribute("aria-pressed", "false");
    });
    botao.classList.add("ativo");
    botao.setAttribute("aria-pressed", "true");

    // 2. Qual categoria foi clicada? (ex: "camisetas", "bottoms", "todos")
    const categoriaEscolhida = botao.dataset.categoria;

    // 3. Mostra ou esconde cada produto
    cardsProdutos.forEach(function (card) {
      const categoriaDoProduto = card.dataset.categoria;

      if (categoriaEscolhida === "todos" || categoriaDoProduto === categoriaEscolhida) {
        card.classList.remove("escondido");
      } else {
        card.classList.add("escondido");
      }
    });

    // Avisa quantos produtos estão na tela agora
    if (statusFiltro) {
      const visiveis = document.querySelectorAll(".produto:not(.escondido)").length;
      statusFiltro.textContent = "Mostrando " + visiveis + (visiveis === 1 ? " produto." : " produtos.");
    }
  });
});


// ==========================================================================
// PASSO 10: MENU NO CELULAR (ABRIR E FECHAR)
// ==========================================================================
if (botaoMenu && menu) {
  // Clicar no botão de 3 linhas abre/fecha o menu
  botaoMenu.addEventListener("click", function () {
    const estaAberto = menu.classList.toggle("aberto");
    botaoMenu.setAttribute("aria-expanded", estaAberto);
    botaoMenu.setAttribute("aria-label", estaAberto ? "Fechar menu" : "Abrir menu");
  });

  // Ao clicar em qualquer link do menu no celular, fecha o menu automaticamente
  menu.addEventListener("click", function (evento) {
    if (evento.target.closest("a")) {
      menu.classList.remove("aberto");
      botaoMenu.setAttribute("aria-expanded", "false");
      botaoMenu.setAttribute("aria-label", "Abrir menu");
    }
  });
}


// ==========================================================================
// PASSO 11: RESERVAR VAGA NAS AULAS GRATUITAS
// ==========================================================================
const listaAtividades = document.querySelectorAll(".atividade");

listaAtividades.forEach(function (atividade) {
  const botao = atividade.querySelector("button");
  const seloVagas = atividade.querySelector(".selo");

  if (!botao || !seloVagas) return;

  // "Reservar vaga" sozinho não diz qual aula; o leitor de tela agora lê o nome também
  const nomeDaAula = atividade.querySelector("h3").textContent;
  botao.setAttribute("aria-label", "Reservar vaga: " + nomeDaAula);

  botao.addEventListener("click", function () {
    let vagasDisponiveis = Number(seloVagas.dataset.vagas);

    if (vagasDisponiveis <= 0) {
      botao.textContent = "Vagas esgotadas";
      botao.disabled = true;
      return;
    }

    // Diminui 1 vaga
    vagasDisponiveis = vagasDisponiveis - 1;
    seloVagas.dataset.vagas = vagasDisponiveis;
    seloVagas.textContent = vagasDisponiveis + (vagasDisponiveis === 1 ? " vaga disponível" : " vagas disponíveis");

    // Muda o visual do botão para confirmado
    botao.textContent = "Vaga reservada! ✓";
    botao.setAttribute("aria-label", "Vaga reservada: " + atividade.querySelector("h3").textContent);
    botao.style.backgroundColor = "#20bd5a";
    botao.disabled = true;

    const tituloAtividade = atividade.querySelector("h3").textContent;
    mostrarAviso("Reserva confirmada em: " + tituloAtividade);
  });
});


// ==========================================================================
// PASSO 12: ANIMAÇÕES SUAVES AO ROLAR A PÁGINA (IntersectionObserver)
// ==========================================================================
// Anima as barras de progresso do impacto (78%, 62%, 81%)
function animarBarrasProgresso() {
  const barras = document.querySelectorAll(".barra__preenchimento");
  barras.forEach(function (barra) {
    const largura = barra.dataset.largura || "0%";
    barra.style.width = largura;
  });
}

// O IntersectionObserver avisa quando um elemento aparece na visão do usuário
if ("IntersectionObserver" in window) {
  const observador = new IntersectionObserver(
    function (entradas, observer) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          // Adiciona a classe 'ativo' que faz o elemento subir suavemente
          entrada.target.classList.add("ativo");

          // Se for a área das metas, anima as barras
          if (entrada.target.classList.contains("barras") || entrada.target.querySelector(".barra__preenchimento")) {
            animarBarrasProgresso();
          }

          // Para de observar este elemento para não rodar à toa
          observer.unobserve(entrada.target);
        }
      });
    },
    {
      threshold: 0.1, // Dispara assim que 10% do elemento aparece na tela
      rootMargin: "0px 0px -20px 0px"
    }
  );

  document.querySelectorAll(".reveal").forEach(function (elemento) {
    observador.observe(elemento);
  });
} else {
  // Caso o navegador seja muito antigo e não suporte IntersectionObserver,
  // mostra tudo normalmente para não deixar nada invisível
  document.querySelectorAll(".reveal").forEach(function (elemento) {
    elemento.classList.add("ativo");
  });
  animarBarrasProgresso();
}


// ==========================================================================
// PASSO 13: MARCAR QUAL LINK DO MENU ESTÁ ATIVO CONFORME A ROLAGEM
// ==========================================================================
const secoes = document.querySelectorAll("section[id], footer[id]");
const linksDoMenu = document.querySelectorAll(".menu__link");

window.addEventListener("scroll", function () {
  // 1. Efeito de sombra no cabeçalho ao rolar para baixo
  if (topo) {
    if (window.scrollY > 30) {
      topo.classList.add("topo--rolado");
    } else {
      topo.classList.remove("topo--rolado");
    }
  }

  // 2. Descobre em qual seção da página estamos navegando
  let secaoAtualId = "";
  secoes.forEach(function (secao) {
    const topoDaSecao = secao.offsetTop - 130;
    if (window.scrollY >= topoDaSecao) {
      secaoAtualId = secao.getAttribute("id");
    }
  });

  // 3. Destaca o link correspondente no menu
  linksDoMenu.forEach(function (link) {
    link.classList.remove("ativo");
    if (link.getAttribute("href") === "#" + secaoAtualId) {
      link.classList.add("ativo");
    }
  });
}, { passive: true });


// ==========================================================================
// PASSO 14: FOTO RESERVA AUTOMÁTICA (Segurança caso alguma imagem falhe)
// ==========================================================================
const IMAGEM_RESERVA =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22800%22%20viewBox%3D%220%200%20800%20800%22%3E%3Crect%20fill%3D%22%23101b18%22%20width%3D%22800%22%20height%3D%22800%22%2F%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22360%22%20r%3D%22140%22%20fill%3D%22none%22%20stroke%3D%22%23c7f36b%22%20stroke-width%3D%2214%22%2F%3E%3Cpath%20d%3D%22M410%20270L340%20380h60l-30%2090%2090-120h-60z%22%20fill%3D%22%23c7f36b%22%2F%3E%3Ctext%20fill%3D%22%23ffffff%22%20font-family%3D%22sans-serif%22%20font-size%3D%2232%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%22570%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%224%22%3EDYNAMO%20SPORTS%3C%2Ftext%3E%3C%2Fsvg%3E";

function tratarErroImagem(imagem) {
  if (imagem.dataset.jaTratouErro) return;
  imagem.dataset.jaTratouErro = "true";
  imagem.src = IMAGEM_RESERVA;
}

document.querySelectorAll("img").forEach(function (imagem) {
  imagem.addEventListener("error", function () {
    tratarErroImagem(imagem);
  });
});


// ==========================================================================
// ACESSIBILIDADE: links que abrem em outra aba avisam quem usa leitor de tela
// ==========================================================================
document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
  const aviso = document.createElement("span");
  aviso.className = "sr-only";
  aviso.textContent = " (abre em uma nova aba)";
  link.appendChild(aviso);
});


// ==========================================================================
// INICIALIZAÇÃO: Carrega o carrinho assim que a página abrir
// ==========================================================================
atualizarCarrinho();
