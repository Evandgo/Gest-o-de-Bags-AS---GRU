const SUPABASE_URL = "https://sjzeuxhxbfmgjuikzzok.supabase.co/rest/v1/";
const SUPABASE_KEY = "COLE_SUA_KEY_AQUI";

let usuarioLogado = {};

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

// ================= FORMATADORES =================
function formatarData(valor) {
  if (!valor) return "";
  try {
    return new Date(valor).toLocaleDateString("pt-BR");
  } catch {
    return valor;
  }
}

function formatarHora(valor) {
  if (!valor) return "";
  try {
    return new Date(`1970-01-01T${valor}`).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return valor;
  }
}

// ================= LOGIN =================
async function login() {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(
    `${SUPABASE_URL}usuarios?username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(password)}`,
    { headers: HEADERS }
  );

  const data = await res.json();

  if (data.length === 0) {
    document.getElementById("error").innerText = "Login inválido";
    return;
  }

  const user = data[0];

  usuarioLogado = {
    nome: user.name,
    empresa: user.company
  };

  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("appContainer").style.display = "block";

  document.querySelector(".bem-vindo").innerText =
    `Bem-vindo (a), ${user.name}`;

  aplicarTema(user.company);
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

// ================= CHAT CONFIG =================
function ajustarChatCia() {

  const chatBox = document.querySelector("#sidebarForm .chat-box");
  if (!chatBox) return;

  const chatHeader = chatBox.querySelector(".chat-header");

  chatBox.classList.remove("latam", "gol", "azul");

  const empresa = usuarioLogado.empresa.toLowerCase();
  chatBox.classList.add(empresa);

  chatHeader.innerText = `Chat ${usuarioLogado.empresa}`;
}

// ================= ENVIAR REQUISIÇÃO =================
async function enviarRequisicao() {

  const agora = new Date();

  const payload = {
    data: agora.toISOString().split("T")[0],
    hora: agora.toISOString().substring(11,19),
    voo: voo.value.toUpperCase(),
    destino: destino.value.toUpperCase(),
    decolagem: decolagem.value,
    bagagem: bagagem.value.toUpperCase(),
    leitura: horario_leitura.value,
    passageiro: pax.value.toUpperCase(),
    reserva: reserva.value.toUpperCase(),
    status: "Pendente",
    colaborador: usuarioLogado.nome,
    empresa: usuarioLogado.empresa
  };

  await fetch(`${SUPABASE_URL}requisicoes`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(payload)
  });

  alert("Salvo com sucesso!");
  limparCampos();
  carregarTabela();
}

// ================= LISTAR REQUISIÇÕES =================
async function carregarTabela() {

  const res = await fetch(`${SUPABASE_URL}requisicoes?select=*`, {
    headers: HEADERS
  });

  const dados = await res.json();

  const tabela = document.getElementById("tabela-requisicoes");
  tabela.innerHTML = "";

  dados.forEach((linha) => {

    if (usuarioLogado.empresa !== "GRU" && linha.empresa !== usuarioLogado.empresa) return;

    let logo = "";
    if (linha.empresa === "LATAM") logo = "logo_latam.png";
    if (linha.empresa === "GOL") logo = "logo_gol.png";
    if (linha.empresa === "AZUL") logo = "logo_azul.png";

    let statusHTML = linha.status;

    if (usuarioLogado.empresa === "GRU") {
      statusHTML = `
        <select onchange="atualizarStatus('${linha.id}', this.value)">
          <option ${linha.status === "Pendente" ? "selected" : ""}>Pendente</option>
          <option ${linha.status === "Liberado" ? "selected" : ""}>Liberado</option>
          <option ${linha.status === "Negado" ? "selected" : ""}>Negado</option>
        </select>
      `;
    }

    tabela.innerHTML += `
      <tr>
        <td>${formatarData(linha.data)}</td>
        <td>${formatarHora(linha.hora)}</td>
        <td>${linha.colaborador}</td>
        <td><img src="${logo}" class="logo-tabela"></td>
        <td>${linha.voo}</td>
        <td>${linha.destino}</td>
        <td>${linha.decolagem}</td>
        <td>${linha.bagagem}</td>
        <td>${linha.leitura}</td>
        <td>${linha.passageiro}</td>
        <td>${linha.reserva}</td>
        <td>${statusHTML}</td>
      </tr>
    `;
  });
}

// ================= ATUALIZAR STATUS =================
async function atualizarStatus(id, novoStatus) {

  await fetch(`${SUPABASE_URL}requisicoes?id=eq.${id}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({ status: novoStatus })
  });

  carregarTabela();
}

// ================= CHAT =================
async function enviarMensagem() {

  const input = document.getElementById("inputMensagemCia");
  const mensagem = input.value.trim();

  if (!mensagem) return;

  const agora = new Date();

  await fetch(`${SUPABASE_URL}chat`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      data: agora.toISOString().split("T")[0],
      hora: agora.toISOString().substring(11,19),
      empresa: usuarioLogado.empresa,
      remetente: usuarioLogado.nome,
      mensagem
    })
  });

  input.value = "";
  carregarMensagens();
}

// ================= CHAT GRU =================
async function enviarMensagemGRU(empresa) {

  const input = document.getElementById("input" + empresa);
  const mensagem = input.value.trim();

  if (!mensagem) return;

  const agora = new Date();

  await fetch(`${SUPABASE_URL}chat`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      data: agora.toISOString().split("T")[0],
      hora: agora.toISOString().substring(11,19),
      empresa: empresa,
      remetente: "GRU",
      mensagem
    })
  });

  input.value = "";
  carregarMensagens();
}

// ================= LISTAR CHAT =================
async function carregarMensagens() {

  const res = await fetch(`${SUPABASE_URL}chat?select=*`, {
    headers: HEADERS
  });

  const dados = await res.json();

  if (usuarioLogado.empresa !== "GRU") {

    const chat = document.getElementById("chatMessagesCia");
    if (!chat) return;

    chat.innerHTML = "";

    dados.forEach(linha => {

      if (linha.empresa !== usuarioLogado.empresa) return;

      const classe = (linha.remetente === usuarioLogado.nome) ? "me" : "other";

      chat.innerHTML += `
        <div class="msg ${classe}">
          <strong>${linha.remetente}</strong>
          <p>${linha.mensagem}</p>
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

        if (linha.empresa !== emp) return;

        const classe = (linha.remetente === "GRU") ? "me" : "other";

        chat.innerHTML += `
          <div class="msg ${classe}">
            <strong>${linha.remetente}</strong>
            <p>${linha.mensagem}</p>
          </div>
        `;
      });

      chat.scrollTop = chat.scrollHeight;
    });
  }
}

// ================= LIMPAR =================
function limparCampos() {
  document.querySelectorAll(".sidebar input").forEach(i => i.value = "");
}

// ================= RELÓGIO =================
function atualizarDataHora() {
  const agora = new Date();
  document.getElementById("data-hora").innerText =
    agora.toLocaleDateString("pt-BR") + " - " +
    agora.toLocaleTimeString("pt-BR");
}

setInterval(atualizarDataHora, 1000);
setInterval(carregarTabela, 5000);