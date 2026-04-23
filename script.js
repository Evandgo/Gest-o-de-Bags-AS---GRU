const SUPABASE_URL = "https://sjzeuxhxbfmgjuikzzok.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_YyfWphLgZCtjpxIaaoKABQ_UC6HRsCj";

let usuarioLogado = {};

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

// ================= DATA BR =================
function getDataHoraBrasil() {
  const agora = new Date();
  const brasil = new Date(
    agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );

  return {
    data: brasil.toISOString().split("T")[0],
    hora: brasil.toTimeString().split(" ")[0]
  };
}

// ================= FORMATADORES =================
function formatarData(valor) {
  if (!valor) return "";
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(valor) {
  if (!valor) return "";
  return valor.substring(0, 5);
}

// ================= LOGIN =================
async function login() {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(
    `${SUPABASE_URL}usuarios?username=ilike.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(password)}`,
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

  document.getElementById("filtroData").value = getDataHoraBrasil().data;

  carregarTabela();
  carregarMensagens();

  setInterval(carregarMensagens, 3000);
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

// ================= ENVIAR REQUISIÇÃO =================
async function enviarRequisicao() {

  const { data, hora } = getDataHoraBrasil();

  const payload = {
    data,
    hora,
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

  limparCampos();
  carregarTabela();
}

// ================= LISTAR REQUISIÇÕES =================
async function carregarTabela() {

  const filtroData = document.getElementById("filtroData").value;

  const res = await fetch(`${SUPABASE_URL}requisicoes?select=*`, {
    headers: HEADERS
  });

  const dados = await res.json();

  const tabela = document.getElementById("tabela-requisicoes");
  tabela.innerHTML = "";

  dados.forEach((linha) => {

    if (linha.data !== filtroData) return;
    if (usuarioLogado.empresa !== "GRU" && linha.empresa !== usuarioLogado.empresa) return;

    let statusHTML = linha.status;

    // 🔥 GRU pode editar
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
        <td>${linha.empresa}</td>
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
    headers: {
      ...HEADERS,
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      status: novoStatus
    })
  });

  carregarTabela();
}

// ================= CHAT =================
async function carregarMensagens() {

  const filtroData = document.getElementById("filtroData").value;

  const res = await fetch(`${SUPABASE_URL}chat?select=*`, {
    headers: HEADERS
  });

  const dados = await res.json();

  // ===== CIA =====
  if (usuarioLogado.empresa !== "GRU") {

    const chat = document.getElementById("chatMessagesCia");
    chat.innerHTML = "";

    dados.forEach(linha => {

      if (linha.data !== filtroData) return;
      if (linha.empresa !== usuarioLogado.empresa) return;

      chat.innerHTML += `
        <div class="msg">
          <strong>${linha.remetente}</strong>
          <p>${linha.mensagem}</p>
        </div>
      `;
    });

  }

  // ===== GRU =====
  else {

    const chats = {
      LATAM: "chatLatam",
      GOL: "chatGol",
      AZUL: "chatAzul"
    };

    Object.keys(chats).forEach(emp => {

      const chat = document.getElementById(chats[emp]);
      chat.innerHTML = "";

      dados.forEach(linha => {

        if (linha.data !== filtroData) return;
        if (linha.empresa !== emp) return;

        chat.innerHTML += `
          <div class="msg">
            <strong>${linha.remetente}</strong>
            <p>${linha.mensagem}</p>
          </div>
        `;
      });

    });
  }
}

// ================= ENVIAR CHAT =================
async function enviarMensagem() {

  const input = document.getElementById("inputMensagemCia");
  const mensagem = input.value.trim();
  if (!mensagem) return;

  const { data, hora } = getDataHoraBrasil();

  await fetch(`${SUPABASE_URL}chat`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      data,
      hora,
      empresa: usuarioLogado.empresa,
      remetente: usuarioLogado.nome,
      mensagem
    })
  });

  input.value = "";
  setTimeout(carregarMensagens, 200);
}

// ================= GRU CHAT =================
async function enviarMensagemGRU(empresa) {

  const input = document.getElementById("input" + empresa);
  const mensagem = input.value.trim();
  if (!mensagem) return;

  const { data, hora } = getDataHoraBrasil();

  await fetch(`${SUPABASE_URL}chat`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      data,
      hora,
      empresa,
      remetente: "GRU",
      mensagem
    })
  });

  input.value = "";
  setTimeout(carregarMensagens, 200);
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