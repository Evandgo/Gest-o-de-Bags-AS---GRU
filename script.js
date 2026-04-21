const BASE_URL = "https://script.google.com/macros/s/AKfycbwiTSeahRXSg6EyVA_u4X_m_4rMVp_3diLrZnR7IoLfgPSFy0ZjDzvoLoU2Q7ldFn6U/exec";

let usuarioLogado = {};


// ================= FORMATADORES =================
function formatarData(valor) {

  if (!valor) return "";

  if (typeof valor === "string" && valor.includes("/")) {
    return valor;
  }

  try {
    const data = new Date(valor);
    if (isNaN(data)) return valor;
    return data.toLocaleDateString("pt-BR");
  } catch {
    return valor;
  }
}


function formatarHora(valor) {

  if (!valor) return "";

  if (typeof valor === "string" && valor.includes(":") && valor.length <= 5) {
    return valor;
  }

  try {
    const data = new Date(valor);
    if (isNaN(data)) return valor;

    return data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return valor;
  }
}


// ================= LOGIN =================
function login() {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "login",
      username,
      password
    })
  })
  .then(res => res.json())
  .then(handleLogin);
}


// ================= HANDLE LOGIN =================
function handleLogin(res) {

  if (!res.success) {
    document.getElementById("error").innerText = "Login inválido";
    return;
  }

  usuarioLogado = {
    nome: res.name,
    empresa: res.company
  };

  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("appContainer").style.display = "block";

  document.querySelector(".bem-vindo").innerText =
    `Bem-vindo (a), ${res.name}`;

  aplicarTema(res.company);
  ajustarChatCia();
  carregarTabela();
  carregarMensagens();

  setInterval(carregarMensagens, 5000);
}


// ================= TEMA =================
function aplicarTema(empresa) {

  const topbar = document.getElementById("topbar");
  const logo = document.getElementById("logoEmpresa");
  const sidebar = document.getElementById("sidebarForm");
  const chat = document.getElementById("chatContainer");

  topbar.classList.remove("latam", "gol", "azul", "gru");

  if (empresa === "GRU") {
    topbar.classList.add("gru");
    logo.src = "GRUATO.png";
    sidebar.style.display = "none";
    chat.style.display = "block";
  } else {
    topbar.classList.add(empresa.toLowerCase());
    logo.src = empresa.toLowerCase() + ".png";
    sidebar.style.display = "block";
    chat.style.display = "none";
  }
}


// ================= AJUSTAR CHAT CIA =================
function ajustarChatCia() {

  const chatBox = document.querySelector("#sidebarForm .chat-box");
  if (!chatBox) return;

  const chatHeader = chatBox.querySelector(".chat-header");

  chatBox.classList.remove("latam", "gol", "azul");

  const empresa = usuarioLogado.empresa.toLowerCase();
  chatBox.classList.add(empresa);

  chatHeader.innerText = `Chat ${usuarioLogado.empresa}`;
}


// ================= ENVIAR MENSAGEM CIA =================
function enviarMensagem() {

  const input = document.getElementById("inputMensagemCia");
  const mensagem = input.value.trim();

  if (!mensagem) return;

  fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "enviarMensagem",
      empresa: usuarioLogado.empresa,
      remetente: usuarioLogado.nome,
      mensagem: mensagem
    })
  })
  .then(() => {
    input.value = "";
    carregarMensagens();
  });
}


// ================= ENVIAR MENSAGEM GRU =================
function enviarMensagemGRU(empresa) {

  const input = document.getElementById("input" + empresa);
  const mensagem = input.value.trim();

  if (!mensagem) return;

  fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "enviarMensagem",
      empresa: empresa,
      remetente: "GRU",
      mensagem: mensagem
    })
  })
  .then(() => {
    input.value = "";
    carregarMensagens();
  });
}


// ================= CARREGAR MENSAGENS =================
function carregarMensagens() {

  fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "listarMensagens" })
  })
  .then(res => res.json())
  .then(dados => {

    if (usuarioLogado.empresa !== "GRU") {

      const chat = document.getElementById("chatMessagesCia");
      if (!chat) return;

      chat.innerHTML = "";

      dados.forEach(linha => {

        if (linha[2] !== usuarioLogado.empresa) return;

        const remetente = linha[3];
        const mensagem = linha[4];

        const classe = (remetente === usuarioLogado.nome) ? "me" : "other";

        chat.innerHTML += `
          <div class="msg ${classe}">
            <strong>${remetente}</strong>
            <p>${mensagem}</p>
          </div>
        `;
      });

      chat.scrollTop = chat.scrollHeight;

    } else {

      const mapas = {
        LATAM: "chatLatam",
        GOL: "chatGol",
        AZUL: "chatAzul"
      };

      Object.keys(mapas).forEach(emp => {

        const chat = document.getElementById(mapas[emp]);
        if (!chat) return;

        chat.innerHTML = "";

        dados.forEach(linha => {

          if (linha[2] !== emp) return;

          const remetente = linha[3];
          const mensagem = linha[4];

          const classe = (remetente === "GRU") ? "me" : "other";

          chat.innerHTML += `
            <div class="msg ${classe}">
              <strong>${remetente}</strong>
              <p>${mensagem}</p>
            </div>
          `;
        });

        chat.scrollTop = chat.scrollHeight;
      });
    }

  });
}


// ================= ENVIAR REQUISIÇÃO =================
function enviarRequisicao() {

  const dados = {
    action: "salvar",
    voo: voo.value.toUpperCase(),
    destino: destino.value.toUpperCase(),
    decolagem: decolagem.value,
    bagagem: bagagem.value.toUpperCase(),
    horario_leitura: horario_leitura.value,
    pax: pax.value.toUpperCase(),
    reserva: reserva.value.toUpperCase(),
    colaborador: usuarioLogado.nome,
    empresa: usuarioLogado.empresa
  };

  fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(dados)
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) {
      alert("Salvo com sucesso!");
      limparCampos();
      carregarTabela();
    }
  });
}


// ================= LIMPAR =================
function limparCampos() {
  document.querySelectorAll(".sidebar input").forEach(i => i.value = "");
}


// ================= CARREGAR TABELA =================
function carregarTabela() {

  fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "listar" })
  })
  .then(res => res.json())
  .then(dados => {

    const tabela = document.getElementById("tabela-requisicoes");
    tabela.innerHTML = "";

    dados.forEach((linha, index) => {

      // filtro por empresa
      if (usuarioLogado.empresa !== "GRU" && linha[11] !== usuarioLogado.empresa) return;

      // LOGO DA CIA
      let logo = "";
      if (linha[11] === "LATAM") logo = "logo_latam.png";
      if (linha[11] === "GOL") logo = "logo_gol.png";
      if (linha[11] === "AZUL") logo = "logo_azul.png";

      // STATUS
      let statusHTML = linha[9];

      if (usuarioLogado.empresa === "GRU") {
        statusHTML = `
          <select onchange="atualizarStatus(${index}, this.value)">
            <option ${linha[9] === "Pendente" ? "selected" : ""}>Pendente</option>
            <option ${linha[9] === "Liberado" ? "selected" : ""}>Liberado</option>
            <option ${linha[9] === "Negado" ? "selected" : ""}>Negado</option>
          </select>
        `;
      }

      tabela.innerHTML += `
        <tr>
          <td>${formatarData(linha[0])}</td>
          <td>${formatarHora(linha[1])}</td>          
          <td>${linha[10]}</td>

          <!-- 🔥 LOGO CORRETO -->
          <td><img src="${logo}" class="logo-tabela"></td>

          <td>${linha[2]}</td>
          <td>${linha[3]}</td>
          <td>${linha[4]}</td>
          <td>${linha[5]}</td>
          <td>${linha[6]}</td>
          <td>${linha[7]}</td>
          <td>${linha[8]}</td>  

          <!-- 🔥 STATUS CORRETO -->
          <td>${statusHTML}</td>
        </tr>
      `;

    });

  });
}


// ================= RELÓGIO =================
function atualizarDataHora() {
  const agora = new Date();
  document.getElementById("data-hora").innerText =
    agora.toLocaleDateString("pt-BR") + " - " +
    agora.toLocaleTimeString("pt-BR");
}

setInterval(atualizarDataHora, 1000);