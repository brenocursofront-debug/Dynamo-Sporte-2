// ==========================================================================
// DYNAMO SPORTS - LOGIN, CADASTRO E SESSÃO
// ==========================================================================
// ATENÇÃO: este site é estático (não tem servidor). Por isso o login é uma
// SIMULAÇÃO educativa: as contas ficam no localStorage do próprio navegador.
// A senha nunca é guardada em texto puro (usamos PBKDF2 + sal aleatório),
// mas num site real a conta e a senha PRECISAM ficar em um servidor/back-end.
//
// O QUE ESTE ARQUIVO FAZ:
// 1. Abre a janela de login (<dialog>) com 3 telas: entrar, criar conta
//    e "minha conta".
// 2. Valida os campos com mensagens claras, anunciadas por leitores de tela.
// 3. Cria contas, faz login e logout.
// 4. Mostra o nome da pessoa no topo e exige login para finalizar a compra.
// ==========================================================================

(function () {
  "use strict";

  var CH_USUARIOS = "dynamoUsuarios"; // { "email": { nome, sal, hash } }
  var CH_SESSAO = "dynamoSessao";     // { nome, email }

  var dialogo = document.getElementById("dialogoLogin");
  var botaoConta = document.getElementById("botaoConta");
  if (!dialogo || !botaoConta) return;

  var textoConta = document.getElementById("textoConta");
  var titulo = document.getElementById("tituloLogin");
  var formLogin = document.getElementById("formLogin");
  var formCadastro = document.getElementById("formCadastro");
  var visaoConta = dialogo.querySelector('[data-visao="conta"]');

  var aoEntrar = null; // função opcional chamada após um login bem-sucedido

  // ------------------------------------------------------------------------
  // Armazenamento (com proteção caso o navegador bloqueie o localStorage)
  // ------------------------------------------------------------------------
  function ler(chave, padrao) {
    try {
      var valor = localStorage.getItem(chave);
      return valor ? JSON.parse(valor) : padrao;
    } catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; }
    catch (e) { return false; }
  }

  // ------------------------------------------------------------------------
  // Senha: gera o "hash" (impressão digital) com sal aleatório
  // ------------------------------------------------------------------------
  function paraHex(bytes) {
    return Array.prototype.map.call(new Uint8Array(bytes), function (b) {
      return ("0" + b.toString(16)).slice(-2);
    }).join("");
  }

  function gerarSal() {
    var sal = new Uint8Array(16);
    (window.crypto || {}).getRandomValues
      ? window.crypto.getRandomValues(sal)
      : sal.forEach(function (_, i) { sal[i] = Math.floor(Math.random() * 256); });
    return paraHex(sal);
  }

  async function gerarHash(senha, sal) {
    // PBKDF2 exige "contexto seguro" (https ou localhost/arquivo local)
    if (window.crypto && window.crypto.subtle) {
      var codificador = new TextEncoder();
      var material = await crypto.subtle.importKey(
        "raw", codificador.encode(senha), "PBKDF2", false, ["deriveBits"]
      );
      var bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: codificador.encode(sal), iterations: 100000, hash: "SHA-256" },
        material, 256
      );
      return paraHex(bits);
    }
    // Plano B (navegador sem crypto.subtle): menos seguro, só para a simulação
    var h = 5381, texto = sal + senha;
    for (var i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
    return "fb" + (h >>> 0).toString(16);
  }

  // ------------------------------------------------------------------------
  // Sessão (quem está logado)
  // ------------------------------------------------------------------------
  function sessaoAtual() { return ler(CH_SESSAO, null); }
  function estaLogado() { return !!sessaoAtual(); }

  function atualizarBotaoConta() {
    var sessao = sessaoAtual();
    if (sessao) {
      var primeiroNome = sessao.nome.split(" ")[0];
      textoConta.textContent = "Olá, " + primeiroNome;
      botaoConta.setAttribute("aria-label", "Minha conta, conectado como " + sessao.nome);
      botaoConta.classList.add("botao-topo--logado");
    } else {
      textoConta.textContent = "Entrar";
      botaoConta.setAttribute("aria-label", "Entrar ou criar conta");
      botaoConta.classList.remove("botao-topo--logado");
    }
  }

  // ------------------------------------------------------------------------
  // Trocar de tela dentro da janela (login / cadastro / conta)
  // ------------------------------------------------------------------------
  var TITULOS = {
    login: "Entrar na sua conta",
    cadastro: "Criar sua conta",
    conta: "Minha conta"
  };

  function mostrarVisao(nome, focarTitulo) {
    dialogo.querySelectorAll("[data-visao]").forEach(function (el) {
      el.hidden = el.dataset.visao !== nome;
    });
    titulo.textContent = TITULOS[nome];
    limparErros(formLogin);
    limparErros(formCadastro);

    if (focarTitulo) {
      titulo.focus(); // leitor de tela anuncia o novo título
    } else {
      var primeiro = dialogo.querySelector('[data-visao="' + nome + '"] input, [data-visao="' + nome + '"] button');
      (primeiro || titulo).focus();
    }
  }

  function abrir(visao, callback) {
    aoEntrar = callback || null;
    var sessao = sessaoAtual();
    if (sessao) {
      document.getElementById("contaNome").textContent = sessao.nome;
      document.getElementById("contaEmail").textContent = sessao.email;
      visao = "conta";
    }
    if (!dialogo.open) dialogo.showModal();
    mostrarVisao(visao || "login", false);
  }

  // ------------------------------------------------------------------------
  // Mensagens de erro
  // ------------------------------------------------------------------------
  function limparErros(form) {
    form.querySelectorAll("input").forEach(function (campo) {
      campo.removeAttribute("aria-invalid");
    });
    form.querySelectorAll(".campo__erro").forEach(function (p) { p.textContent = ""; });
    var resumo = form.querySelector(".form__resumo");
    resumo.textContent = "";
    resumo.classList.remove("form__resumo--ok");
  }

  function erroNoCampo(campo, mensagem) {
    campo.setAttribute("aria-invalid", "true");
    var p = document.getElementById(campo.id + "Erro");
    if (p) p.textContent = "Erro: " + mensagem;
  }

  // Mostra o resumo no topo e leva o foco ao primeiro campo com problema
  function finalizarValidacao(form, camposComErro) {
    if (camposComErro.length === 0) return true;
    var resumo = form.querySelector(".form__resumo");
    resumo.textContent = camposComErro.length === 1
      ? "Há 1 campo para corrigir."
      : "Há " + camposComErro.length + " campos para corrigir.";
    camposComErro[0].focus();
    return false;
  }

  // ------------------------------------------------------------------------
  // Regras de validação
  // ------------------------------------------------------------------------
  var REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function normalizarEmail(valor) { return valor.trim().toLowerCase(); }

  function mensagemSenhaFraca(senha) {
    if (senha.length < 8) return "a senha precisa ter pelo menos 8 caracteres.";
    if (!/[A-Za-zÀ-ú]/.test(senha)) return "a senha precisa ter pelo menos 1 letra.";
    if (!/[0-9]/.test(senha)) return "a senha precisa ter pelo menos 1 número.";
    return "";
  }

  // ------------------------------------------------------------------------
  // ENTRAR
  // ------------------------------------------------------------------------
  formLogin.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    limparErros(formLogin);

    var campoEmail = formLogin.elements.email;
    var campoSenha = formLogin.elements.senha;
    var erros = [];

    var email = normalizarEmail(campoEmail.value);
    if (!email) { erroNoCampo(campoEmail, "digite seu e-mail."); erros.push(campoEmail); }
    else if (!REGEX_EMAIL.test(email)) { erroNoCampo(campoEmail, "digite um e-mail válido, como nome@exemplo.com."); erros.push(campoEmail); }

    if (!campoSenha.value) { erroNoCampo(campoSenha, "digite sua senha."); erros.push(campoSenha); }

    if (!finalizarValidacao(formLogin, erros)) return;

    var usuarios = ler(CH_USUARIOS, {});
    var usuario = usuarios[email];
    var hash = usuario ? await gerarHash(campoSenha.value, usuario.sal) : "";

    // A mesma mensagem para "e-mail não existe" e "senha errada": não revela quem tem conta
    if (!usuario || hash !== usuario.hash) {
      formLogin.querySelector(".form__resumo").textContent =
        "E-mail ou senha incorretos. Confira os dados e tente de novo, ou crie uma conta.";
      campoSenha.value = "";
      campoSenha.focus();
      return;
    }

    concluirLogin(usuario.nome, email);
  });

  // ------------------------------------------------------------------------
  // CRIAR CONTA
  // ------------------------------------------------------------------------
  formCadastro.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    limparErros(formCadastro);

    var f = formCadastro.elements;
    var erros = [];

    var nome = f.nome.value.trim().replace(/\s+/g, " ");
    if (nome.length < 3) { erroNoCampo(f.nome, "digite seu nome completo."); erros.push(f.nome); }

    var email = normalizarEmail(f.email.value);
    if (!email) { erroNoCampo(f.email, "digite seu e-mail."); erros.push(f.email); }
    else if (!REGEX_EMAIL.test(email)) { erroNoCampo(f.email, "digite um e-mail válido, como nome@exemplo.com."); erros.push(f.email); }

    var problemaSenha = mensagemSenhaFraca(f.senha.value);
    if (problemaSenha) { erroNoCampo(f.senha, problemaSenha); erros.push(f.senha); }

    if (!f.senha2.value) { erroNoCampo(f.senha2, "repita a senha."); erros.push(f.senha2); }
    else if (f.senha2.value !== f.senha.value) { erroNoCampo(f.senha2, "as duas senhas precisam ser iguais."); erros.push(f.senha2); }

    if (!f.termos.checked) { erroNoCampo(f.termos, "marque a caixa para aceitar os termos."); erros.push(f.termos); }

    if (!finalizarValidacao(formCadastro, erros)) return;

    var usuarios = ler(CH_USUARIOS, {});
    if (usuarios[email]) {
      erroNoCampo(f.email, "já existe uma conta com este e-mail. Use a opção Entrar.");
      finalizarValidacao(formCadastro, [f.email]);
      return;
    }

    var sal = gerarSal();
    usuarios[email] = { nome: nome, sal: sal, hash: await gerarHash(f.senha.value, sal) };

    if (!gravar(CH_USUARIOS, usuarios)) {
      formCadastro.querySelector(".form__resumo").textContent =
        "Não foi possível salvar a conta: seu navegador está bloqueando o armazenamento.";
      return;
    }

    concluirLogin(nome, email);
  });

  // ------------------------------------------------------------------------
  // Depois de entrar com sucesso
  // ------------------------------------------------------------------------
  function concluirLogin(nome, email) {
    gravar(CH_SESSAO, { nome: nome, email: email });
    atualizarBotaoConta();
    formLogin.reset();
    formCadastro.reset();
    dialogo.close();

    if (typeof window.mostrarAviso === "function") {
      window.mostrarAviso("Você entrou na sua conta. Olá, " + nome.split(" ")[0] + "!");
    }
    if (typeof aoEntrar === "function") {
      var depois = aoEntrar;
      aoEntrar = null;
      depois();
    }
  }

  // ------------------------------------------------------------------------
  // Sair
  // ------------------------------------------------------------------------
  document.getElementById("botaoSair").addEventListener("click", function () {
    try { localStorage.removeItem(CH_SESSAO); } catch (e) { /* ok */ }
    atualizarBotaoConta();
    dialogo.close();
    if (typeof window.mostrarAviso === "function") window.mostrarAviso("Você saiu da sua conta.");
  });

  // ------------------------------------------------------------------------
  // Botões e atalhos da janela
  // ------------------------------------------------------------------------
  botaoConta.addEventListener("click", function () { abrir("login"); });

  dialogo.addEventListener("click", function (evento) {
    // Fechar: botão X ou clique no fundo escuro
    if (evento.target === dialogo || evento.target.closest("[data-fechar]")) {
      dialogo.close();
      return;
    }
    // Trocar entre "Entrar" e "Criar conta"
    var troca = evento.target.closest("[data-ir]");
    if (troca) mostrarVisao(troca.dataset.ir, true);

    // Mostrar / ocultar a senha
    var ver = evento.target.closest("[data-ver-senha]");
    if (ver) {
      var campo = document.getElementById(ver.dataset.verSenha);
      var mostrar = campo.type === "password";
      campo.type = mostrar ? "text" : "password";
      ver.textContent = mostrar ? "Ocultar" : "Mostrar";
      ver.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      ver.setAttribute("aria-pressed", mostrar ? "true" : "false");
    }
  });

  // Ao fechar, volta todas as senhas para o modo escondido
  dialogo.addEventListener("close", function () {
    dialogo.querySelectorAll('input[type="text"][id$="Senha"], input[type="text"][id$="Senha2"]').forEach(function (campo) {
      campo.type = "password";
    });
    dialogo.querySelectorAll("[data-ver-senha]").forEach(function (b) {
      b.textContent = "Mostrar";
      b.setAttribute("aria-label", "Mostrar senha");
      b.setAttribute("aria-pressed", "false");
    });
  });

  // ------------------------------------------------------------------------
  // Disponibiliza para o script.js (carrinho)
  // ------------------------------------------------------------------------
  window.DynamoLogin = { abrir: abrir, logado: estaLogado };

  atualizarBotaoConta();
})();
