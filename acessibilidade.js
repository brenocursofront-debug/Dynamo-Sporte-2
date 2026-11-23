// ==========================================================================
// DYNAMO SPORTS - PAINEL DE ACESSIBILIDADE
// ==========================================================================
// O QUE ESTE ARQUIVO FAZ:
// 1. Abre/fecha o painel "Acessibilidade" (uma janela <dialog>).
// 2. Liga e desliga os recursos: tamanho do texto, alto contraste, fonte
//    de leitura fácil, espaçamento, destaque de links, régua de leitura,
//    modo calmo, parar animações, avisos mais longos e Libras (VLibras).
// 3. Lê o texto em voz alta (síntese de voz do navegador).
// 4. Guarda as escolhas no navegador (localStorage) e aplica ao abrir o site.
//
// Este arquivo é carregado com "defer" no <head>: ele roda assim que o HTML
// termina de ser lido, antes de a página aparecer, evitando "piscar" o visual.
// ==========================================================================

(function () {
  "use strict";

  var CHAVE = "dynamoAcessibilidade";

  // Valores iniciais de tudo (o que "Restaurar padrão" volta a usar)
  var PADRAO = {
    fonte: 0,            // 0 = 100%, 1 = 115%, 2 = 130%, 3 = 150%
    contraste: false,
    legivel: false,
    espaco: false,
    links: false,
    regua: false,
    calmo: false,
    semAnimacao: false,
    avisosLongos: false,
    libras: false
  };

  var NIVEIS_FONTE = [1, 1.15, 1.3, 1.5];
  var html = document.documentElement;
  var config = Object.assign({}, PADRAO);

  // ------------------------------------------------------------------------
  // Guardar e ler as escolhas (com proteção: o navegador pode bloquear)
  // ------------------------------------------------------------------------
  function carregar() {
    try {
      var salvo = JSON.parse(localStorage.getItem(CHAVE) || "{}");
      Object.keys(PADRAO).forEach(function (k) {
        if (typeof salvo[k] === typeof PADRAO[k]) config[k] = salvo[k];
      });
    } catch (e) { /* segue com o padrão */ }
  }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(config)); } catch (e) { /* ok */ }
  }

  // ------------------------------------------------------------------------
  // Aplicar as escolhas na página (classes no <html>)
  // ------------------------------------------------------------------------
  function aplicar() {
    html.style.setProperty("--a11y-zoom", NIVEIS_FONTE[config.fonte]);
    html.classList.toggle("a11y-contraste", config.contraste);
    html.classList.toggle("a11y-legivel", config.legivel);
    html.classList.toggle("a11y-espaco", config.espaco);
    html.classList.toggle("a11y-links", config.links);
    html.classList.toggle("a11y-calmo", config.calmo);
    html.classList.toggle("a11y-sem-animacao", config.semAnimacao);

    // Avisos (toast) ficam mais tempo na tela no modo calmo ou se a pessoa pedir
    window.dynamoDuracaoAviso = (config.calmo || config.avisosLongos) ? 8000 : 2800;
  }

  // ------------------------------------------------------------------------
  // Tudo abaixo precisa do HTML pronto
  // ------------------------------------------------------------------------
  function iniciarPainel() {
    var painel = document.getElementById("painelAcessibilidade");
    var botaoAbrir = document.getElementById("botaoAcessibilidade");
    if (!painel || !botaoAbrir) return;

    var chaves = painel.querySelectorAll(".chave[data-a11y]");
    var valorFonte = document.getElementById("a11yFonteValor");
    var botaoMais = document.getElementById("a11yMais");
    var botaoMenos = document.getElementById("a11yMenos");
    var regua = document.getElementById("reguaLeitura");

    function avisar(texto) {
      if (typeof window.mostrarAviso === "function") window.mostrarAviso(texto);
    }

    // Atualiza o visual e o estado (aria-pressed) de cada chave
    function sincronizar() {
      chaves.forEach(function (chave) {
        var ligada = !!config[chave.dataset.a11y];
        chave.setAttribute("aria-pressed", ligada ? "true" : "false");
        chave.querySelector(".chave__estado").textContent = ligada ? "Ligado" : "Desligado";
      });
      valorFonte.textContent = Math.round(NIVEIS_FONTE[config.fonte] * 100) + "%";
      botaoMais.disabled = config.fonte >= NIVEIS_FONTE.length - 1;
      botaoMenos.disabled = config.fonte <= 0;
      regua.hidden = !config.regua;
    }

    function mudou() {
      aplicar();
      sincronizar();
      salvar();
    }

    // ---- Abrir e fechar o painel ----
    botaoAbrir.addEventListener("click", function () {
      painel.showModal();
      document.getElementById("tituloAcessibilidade").focus();
    });
    painel.addEventListener("click", function (e) {
      // Clique no fundo escuro (fora da janela) ou no X fecha
      if (e.target === painel || e.target.closest("[data-fechar]")) painel.close();
    });

    // ---- Chaves liga/desliga ----
    chaves.forEach(function (chave) {
      chave.addEventListener("click", function () {
        var nome = chave.dataset.a11y;
        config[nome] = !config[nome];

        // Modo calmo já para as animações; deixa a chave separada coerente
        if (nome === "calmo" && config.calmo) config.semAnimacao = true;

        mudou();
        if (nome === "libras") alternarLibras(config.libras);
        if (nome === "regua" && config.regua) posicionarRegua(window.innerHeight * 0.4);

        var rotulo = chave.querySelector(".chave__rotulo").firstChild.textContent.trim();
        avisar(rotulo + (config[nome] ? ": ligado." : ": desligado."));
      });
    });

    // ---- Tamanho do texto ----
    botaoMais.addEventListener("click", function () {
      if (config.fonte < NIVEIS_FONTE.length - 1) { config.fonte++; mudou(); }
    });
    botaoMenos.addEventListener("click", function () {
      if (config.fonte > 0) { config.fonte--; mudou(); }
    });

    // ---- Perfis rápidos ----
    var PERFIS = {
      cegueira: { fonte: 2, contraste: true, links: true, legivel: true, espaco: true },
      surdez: { libras: true, avisosLongos: true },
      autismo: { calmo: true, semAnimacao: true, avisosLongos: true, legivel: true }
    };
    painel.querySelectorAll("[data-perfil]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        config = Object.assign({}, PADRAO, PERFIS[botao.dataset.perfil]);
        mudou();
        alternarLibras(config.libras);
        avisar("Perfil aplicado: " + botao.textContent.trim() + ".");
      });
    });

    // ---- Restaurar padrão ----
    document.getElementById("a11yRestaurar").addEventListener("click", function () {
      config = Object.assign({}, PADRAO);
      pararLeitura();
      mudou();
      alternarLibras(false);
      avisar("Acessibilidade restaurada ao padrão.");
    });

    // ---- Ler em voz alta ----
    document.getElementById("a11yLer").addEventListener("click", lerEmVozAlta);
    document.getElementById("a11yParar").addEventListener("click", pararLeitura);

    // ---- Régua de leitura: segue o mouse e o foco do teclado ----
    function posicionarRegua(y) {
      var altura = regua.offsetHeight || 56;
      regua.style.top = Math.max(0, y - altura / 2) + "px";
    }
    document.addEventListener("mousemove", function (e) {
      if (config.regua) posicionarRegua(e.clientY);
    }, { passive: true });
    document.addEventListener("focusin", function (e) {
      if (!config.regua || !e.target.getBoundingClientRect) return;
      var r = e.target.getBoundingClientRect();
      posicionarRegua(r.top + r.height / 2);
    });

    sincronizar();
    if (config.libras) alternarLibras(true);
  }

  // ------------------------------------------------------------------------
  // LER EM VOZ ALTA (Web Speech API)
  // O navegador corta falas muito longas, então dividimos em frases curtas.
  // ------------------------------------------------------------------------
  function dividirEmTrechos(texto) {
    var frases = texto.replace(/\s+/g, " ").match(/[^.!?]+[.!?]*/g) || [texto];
    var trechos = [];
    var atual = "";
    frases.forEach(function (frase) {
      if ((atual + frase).length > 180) {
        if (atual) trechos.push(atual.trim());
        atual = frase;
      } else {
        atual += frase;
      }
    });
    if (atual.trim()) trechos.push(atual.trim());
    return trechos;
  }

  function lerEmVozAlta() {
    if (!("speechSynthesis" in window)) {
      if (typeof window.mostrarAviso === "function") {
        window.mostrarAviso("Seu navegador não tem leitura em voz alta.");
      }
      return;
    }
    var selecionado = String(window.getSelection ? window.getSelection() : "").trim();
    var principal = document.getElementById("conteudo");
    var texto = selecionado || (principal ? principal.innerText : "");
    if (!texto) return;

    window.speechSynthesis.cancel();
    dividirEmTrechos(texto).forEach(function (trecho) {
      var fala = new SpeechSynthesisUtterance(trecho);
      fala.lang = "pt-BR";
      fala.rate = 0.95;
      window.speechSynthesis.speak(fala);
    });
  }

  function pararLeitura() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // ------------------------------------------------------------------------
  // LIBRAS (VLibras - serviço gratuito do governo federal)
  // Só é baixado se a pessoa ligar a opção, por privacidade e velocidade.
  // ------------------------------------------------------------------------
  function alternarLibras(ligar) {
    var existente = document.getElementById("vlibras-container");

    if (!ligar) {
      if (existente) existente.hidden = true;
      return;
    }
    if (existente) { existente.hidden = false; return; }

    var recipiente = document.createElement("div");
    recipiente.id = "vlibras-container";
    recipiente.setAttribute("vw", "");
    recipiente.className = "enabled";
    recipiente.innerHTML =
      '<div vw-access-button class="active"></div>' +
      '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(recipiente);

    var script = document.createElement("script");
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.onload = function () {
      try { new window.VLibras.Widget("https://vlibras.gov.br/app"); } catch (e) { /* sem rede */ }
    };
    script.onerror = function () {
      if (typeof window.mostrarAviso === "function") {
        window.mostrarAviso("Não foi possível carregar o VLibras. Verifique sua internet.");
      }
    };
    document.body.appendChild(script);
  }

  // ------------------------------------------------------------------------
  // INICIALIZAÇÃO
  // ------------------------------------------------------------------------
  carregar();
  aplicar(); // aplica já, antes de a página aparecer

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarPainel);
  } else {
    iniciarPainel();
  }
})();
