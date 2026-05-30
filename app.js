const STORAGE_KEY = "controle_teatros_v2";
const SESSION_KEY = "controle_teatros_sessao_v2";

const appState = {
  rota: "dashboard",
  modal: "",
  sidebarAberta: false,
  teatroSelecionadoId: null,
  filtrosDashboard: { busca: "", data_inicio: "", data_fim: "", prioridade: "" },
  filtrosTeatros: { busca: "", estado_id: "", cidade_id: "", situacao: "", prioridade: "" }
};

const estadosSeed = [
  ["MG", "Minas Gerais", "Sudeste"], ["SP", "Sao Paulo", "Sudeste"], ["RJ", "Rio de Janeiro", "Sudeste"],
  ["ES", "Espirito Santo", "Sudeste"], ["PR", "Parana", "Sul"], ["SC", "Santa Catarina", "Sul"],
  ["RS", "Rio Grande do Sul", "Sul"], ["BA", "Bahia", "Nordeste"], ["DF", "Distrito Federal", "Centro-Oeste"],
  ["GO", "Goias", "Centro-Oeste"], ["PE", "Pernambuco", "Nordeste"], ["CE", "Ceara", "Nordeste"]
].map((item, i) => ({ id: `estado_${i + 1}`, uf: item[0], nome: item[1], regiao: item[2] }));

const cidadesSeed = {
  MG: ["Belo Horizonte", "Contagem", "Betim", "Nova Lima", "Juiz de Fora", "Uberlandia", "Uberaba", "Montes Claros", "Divinopolis", "Pocos de Caldas", "Varginha", "Pouso Alegre", "Ouro Preto", "Mariana", "Ipatinga", "Governador Valadares", "Lavras", "Sao Joao del-Rei", "Patos de Minas", "Araxa"],
  SP: ["Sao Paulo", "Campinas", "Santos", "Santo Andre", "Sao Bernardo do Campo", "Sao Caetano do Sul", "Osasco", "Guarulhos", "Barueri", "Jundiai", "Sorocaba", "Ribeirao Preto", "Sao Jose dos Campos", "Taubate", "Piracicaba", "Bauru", "Marilia", "Araraquara", "Sao Carlos", "Franca"],
  RJ: ["Rio de Janeiro", "Niteroi", "Petropolis", "Nova Iguacu", "Volta Redonda"],
  ES: ["Vitoria", "Vila Velha", "Serra", "Cariacica"],
  PR: ["Curitiba", "Londrina", "Maringa", "Ponta Grossa", "Foz do Iguacu"],
  SC: ["Florianopolis", "Joinville", "Blumenau", "Chapeco", "Itajai"],
  RS: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Santa Maria", "Gramado"],
  BA: ["Salvador", "Feira de Santana"], DF: ["Brasilia"], GO: ["Goiania"], PE: ["Recife"], CE: ["Fortaleza"]
};

function agoraIso() { return new Date().toISOString(); }
function hojeIso() { return new Date().toISOString().slice(0, 10); }
function id(prefixo) { return `${prefixo}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`; }
function esc(v) { return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }
function norm(v) { return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function dataBR(v) { if (!v) return "-"; const [a, m, d] = v.slice(0, 10).split("-"); return a && m && d ? `${d}/${m}/${a}` : v; }

function rotulo(v) {
  return ({ ADMINISTRADOR: "Administrador", OPERADOR: "Operador", PROSPECTO: "Prospecto", ATIVO: "Ativo", INATIVO: "Inativo", SEM_INTERESSE: "Sem interesse", CONTATAR_DEPOIS: "Contatar depois", BAIXA: "Baixa", MEDIA: "Media", ALTA: "Alta", EMAIL: "E-mail", TELEFONE: "Telefone", WHATSAPP: "WhatsApp", INSTAGRAM: "Instagram", PRESENCIAL: "Presencial", OUTRO: "Outro", SEM_RESPOSTA: "Sem resposta", RESPONDEU: "Respondeu", INTERESSADO: "Interessado", SOLICITOU_RETORNO: "Solicitou retorno", AGENDA_ABRE_DEPOIS: "Agenda abre depois" })[v] || v || "-";
}
function badgeClasse(v) { if (["ATIVO", "ALTA", "INTERESSADO", "ADMINISTRADOR"].includes(v)) return "ok"; if (["MEDIA", "CONTATAR_DEPOIS", "SOLICITOU_RETORNO", "AGENDA_ABRE_DEPOIS"].includes(v)) return "warn"; if (["BAIXA", "INATIVO", "SEM_INTERESSE"].includes(v)) return "danger"; return ""; }
function badgeData(data) { const h = hojeIso(); const cls = !data ? "" : data < h ? "danger" : data === h ? "ok" : "warn"; return `<span class="badge ${cls}">${dataBR(data)}</span>`; }

function gerarCidades() {
  let n = 1;
  return Object.entries(cidadesSeed).flatMap(([uf, nomes]) => {
    const estado = estadosSeed.find(e => e.uf === uf);
    return nomes.map((nome, i) => ({ id: `cidade_${n++}`, estado_id: estado.id, nome, eh_capital: i === 0, ativa: true }));
  });
}
function estadoId(uf) { return estadosSeed.find(e => e.uf === uf)?.id || ""; }
function cidadeId(nome, uf, cidades) { const estado = estadoId(uf); return cidades.find(c => c.estado_id === estado && c.nome === nome)?.id || ""; }

function bancoInicial() {
  const cidades = gerarCidades();
  const agora = agoraIso();
  const usuarios = [
    { id: "usuario_admin", nome: "Administrador", email: "admin@teatros.com", senha: "admin123", perfil: "ADMINISTRADOR", ativo: true, ultimo_acesso_em: "" },
    { id: "usuario_operador", nome: "Operador Comercial", email: "operador@teatros.com", senha: "operador123", perfil: "OPERADOR", ativo: true, ultimo_acesso_em: "" },
    { id: "usuario_operador_2", nome: "Operadora Sudeste", email: "sudeste@teatros.com", senha: "sudeste123", perfil: "OPERADOR", ativo: true, ultimo_acesso_em: "" }
  ];
  const teatros = [
    teatroSeed("teatro_palacio_artes", "Grande Teatro Cemig Palacio das Artes", "MG", "Belo Horizonte", "agenda@fcs.mg.gov.br", "(31) 0000-0000", "Responsavel de Programacao", "Agenda abre por janelas semestrais. Retomar antes da abertura oficial.", "2026-08-05", "ALTA", "CONTATAR_DEPOIS", "usuario_operador", cidades, 1700),
    teatroSeed("teatro_sesi_minas", "Teatro SESI Minas", "MG", "Belo Horizonte", "cultura@fiemg.com.br", "(31) 0000-0000", "", "Bom alvo para temporada curta.", hojeIso(), "MEDIA", "ATIVO", "usuario_operador", cidades, 660),
    teatroSeed("teatro_guaira", "Teatro Guaira", "PR", "Curitiba", "contato@teatroguaira.pr.gov.br", "(41) 0000-0000", "", "Retornar com proposta comercial.", "2026-06-03", "MEDIA", "PROSPECTO", "usuario_operador", cidades, 2173),
    teatroSeed("teatro_sp_municipal", "Theatro Municipal de Sao Paulo", "SP", "Sao Paulo", "programacao@municipalsp.org.br", "(11) 0000-0000", "Secretaria de Agenda", "Contato institucional. Exige antecedencia.", "2026-06-01", "ALTA", "ATIVO", "usuario_operador_2", cidades, 1523)
  ];
  const tentativas_contato = [
    { id: "tentativa_1", teatro_id: "teatro_palacio_artes", usuario_id: "usuario_operador", data_tentativa: "2026-05-21T10:20", canal: "EMAIL", resultado: "AGENDA_ABRE_DEPOIS", resumo: "Informaram que a agenda do proximo semestre deve abrir em agosto.", proximo_contato_em: "2026-08-05", data_criacao: agora, data_atualizacao: agora },
    { id: "tentativa_2", teatro_id: "teatro_guaira", usuario_id: "usuario_operador", data_tentativa: "2026-05-24T15:00", canal: "TELEFONE", resultado: "SOLICITOU_RETORNO", resumo: "Pediram retorno com datas entre setembro e outubro.", proximo_contato_em: "2026-06-03", data_criacao: agora, data_atualizacao: agora }
  ];
  return { usuarios, estados: estadosSeed, cidades, teatros, tentativas_contato, registros_auditoria: [] };
}
function teatroSeed(idTeatro, nome, uf, cidade, email, telefone, responsavel, relato, prox, prioridade, situacao, usuario, cidades, capacidade) {
  const agora = agoraIso();
  return { id: idTeatro, nome, email, telefone, whatsapp: "", site: "", instagram: "", logradouro: "", numero: "", complemento: "", bairro: "", estado_id: estadoId(uf), cidade_id: cidadeId(cidade, uf, cidades), capacidade, responsavel_1_nome: responsavel, responsavel_1_cargo: "", responsavel_1_email: email, responsavel_1_telefone: telefone, responsavel_1_whatsapp: "", responsavel_2_nome: "", responsavel_2_cargo: "", responsavel_2_email: "", responsavel_2_telefone: "", responsavel_2_whatsapp: "", relato, relato_usuario_id: usuario, relato_atualizado_em: agora, proximo_contato_em: prox, situacao, prioridade, usuario_responsavel_id: usuario, criado_por_usuario_id: "usuario_admin", data_criacao: agora, data_atualizacao: agora };
}

let banco = carregarBanco();
function carregarBanco() { const salvo = localStorage.getItem(STORAGE_KEY); if (salvo) return JSON.parse(salvo); const inicial = bancoInicial(); salvarBanco(inicial); return inicial; }
function salvarBanco(db) { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
function usuarioAtual() { const uid = sessionStorage.getItem(SESSION_KEY); return uid ? banco.usuarios.find(u => u.id === uid && u.ativo) : null; }
function podeAdministrar() { return usuarioAtual()?.perfil === "ADMINISTRADOR"; }
function obterUsuario(uid) { return banco.usuarios.find(u => u.id === uid); }
function obterEstado(eid) { return banco.estados.find(e => e.id === eid); }
function obterCidade(cid) { return banco.cidades.find(c => c.id === cid); }
function obterTeatro(tid) { return banco.teatros.find(t => t.id === tid); }
function cidadesDoEstado(eid) { return banco.cidades.filter(c => c.ativa && (!eid || c.estado_id === eid)); }
function teatrosPermitidos() { const u = usuarioAtual(); if (!u) return []; if (u.perfil === "ADMINISTRADOR") return banco.teatros; return banco.teatros.filter(t => t.usuario_responsavel_id === u.id || t.criado_por_usuario_id === u.id); }
function ultimoContato(tid) { return banco.tentativas_contato.filter(t => t.teatro_id === tid).sort((a, b) => b.data_tentativa.localeCompare(a.data_tentativa))[0]; }

function renderizar() {
  const app = document.getElementById("app");
  const usuario = usuarioAtual();
  if (!usuario) { app.innerHTML = renderLogin(); return; }
  app.innerHTML = `<div class="app-shell">${renderSidebar(usuario)}<main class="main">${renderTopbar(usuario)}<section class="content">${renderRota()}</section></main></div>${appState.modal}`;
}
function renderLogin() {
  return `<section class="login-page"><div class="login-art"><h1>Controle comercial de teatros</h1><p>Organize a rotina de contatos com teatros brasileiros em uma operacao simples e privada.</p></div><div class="login-panel"><form class="login-box" onsubmit="entrar(event)"><h2>Acesso privado</h2><p>Use a conta de demonstracao do operador para acessar a fila de contatos.</p><label>E-mail<input name="email" type="email" value="operador@teatros.com" required></label><label style="margin-top:12px">Senha<input name="senha" type="password" value="operador123" required></label><button class="btn" style="width:100%;margin-top:16px" type="submit">Entrar</button><div class="demo-access"><strong>Conta inicial</strong><span>Operador: operador@teatros.com / operador123</span></div></form></div></section>`;
}
function renderSidebar(usuario) {
  const itens = [["dashboard", "HJ", "Contatos de hoje"], ["teatros", "TT", "Teatros"]];
  if (usuario.perfil === "ADMINISTRADOR") itens.push(["relatorios", "RL", "Relatorios"], ["usuarios", "US", "Usuarios"]);
  return `<aside class="sidebar ${appState.sidebarAberta ? "open" : ""}"><div class="brand"><strong>Teatros BR</strong><span>CRM comercial privado</span></div><nav class="nav">${itens.map(i => `<button class="${appState.rota === i[0] ? "active" : ""}" onclick="navegar('${i[0]}')"><span class="nav-icon">${i[1]}</span><span>${i[2]}</span></button>`).join("")}</nav><div class="sidebar-footer"><div>${esc(usuario.nome)}</div><span>${rotulo(usuario.perfil)}</span><button class="btn secondary small" style="width:100%;margin-top:12px" onclick="sair()">Sair</button></div></aside>`;
}
function renderTopbar(usuario) { const tit = { dashboard: "Contatos a fazer", teatros: "Teatros", relatorios: "Relatorios", usuarios: "Usuarios" }; return `<header class="topbar"><div style="display:flex;align-items:center;gap:12px"><button class="btn secondary small mobile-menu" onclick="alternarMenu()">Menu</button><div><h1>${tit[appState.rota] || "Sistema"}</h1><p>${rotulo(usuario.perfil)} conectado</p></div></div><button class="btn secondary small" onclick="resetarDados()">Restaurar dados iniciais</button></header>`; }
function renderRota() { if (appState.teatroSelecionadoId) return renderDetalheTeatro(); return ({ dashboard: renderDashboard, teatros: renderTeatros, relatorios: renderRelatorios, usuarios: renderUsuarios }[appState.rota] || renderDashboard)(); }

function renderDashboard() {
  const f = appState.filtrosDashboard;
  const teatros = filtrarFila();
  return `<section class="panel"><div class="panel-header"><h2>Fila de contatos do operador</h2><button class="btn" onclick="abrirTeatro()">Novo teatro</button></div><div class="panel-body"><div class="filters"><input placeholder="Buscar por teatro, cidade, responsavel ou relato" value="${esc(f.busca)}" oninput="filtroDash('busca',this.value)"><input type="date" value="${f.data_inicio}" onchange="filtroDash('data_inicio',this.value)" title="Data inicial"><input type="date" value="${f.data_fim}" onchange="filtroDash('data_fim',this.value)" title="Data final"><select onchange="filtroDash('prioridade',this.value)">${opcoesEnum(["BAIXA", "MEDIA", "ALTA"], f.prioridade, "Relevancia")}</select></div></div><div class="table-wrap">${tabelaFila(teatros)}</div></section>`;
}
function filtrarFila() {
  const f = appState.filtrosDashboard;
  return teatrosPermitidos().filter(t => {
    const texto = norm(`${t.nome} ${t.relato} ${t.responsavel_1_nome} ${t.responsavel_1_email} ${t.responsavel_1_telefone} ${t.responsavel_2_nome} ${obterCidade(t.cidade_id)?.nome} ${obterEstado(t.estado_id)?.uf}`);
    return (!f.busca || texto.includes(norm(f.busca))) && (!f.data_inicio || t.proximo_contato_em >= f.data_inicio) && (!f.data_fim || t.proximo_contato_em <= f.data_fim) && (!f.prioridade || t.prioridade === f.prioridade);
  }).sort((a, b) => (a.proximo_contato_em || "9999-12-31").localeCompare(b.proximo_contato_em || "9999-12-31"));
}
function tabelaFila(teatros) {
  if (!teatros.length) return `<div class="empty">Nenhum contato encontrado para os filtros atuais.</div>`;
  return `<table><thead><tr><th>Proximo contato</th><th>Teatro</th><th>Responsavel</th><th>Cidade/UF</th><th>Relevancia</th><th>Ultimo relato</th><th>Acoes</th></tr></thead><tbody>${teatros.map(t => { const ult = ultimoContato(t.id); return `<tr><td>${badgeData(t.proximo_contato_em)}</td><td><button class="link-button" onclick="verTeatro('${t.id}')">${esc(t.nome)}</button><br><span style="color:var(--muted)">${rotulo(t.situacao)}</span></td><td>${responsaveis(t)}</td><td>${esc(obterCidade(t.cidade_id)?.nome || "-")}/${esc(obterEstado(t.estado_id)?.uf || "-")}</td><td><span class="badge ${badgeClasse(t.prioridade)}">${rotulo(t.prioridade)}</span></td><td>${relatoResumo(t, ult)}</td><td><button class="btn small" onclick="abrirContatoRealizado('', '${t.id}')">Fazer contato</button></td></tr>`; }).join("")}</tbody></table>`;
}
function relatoResumo(t, ult) { const texto = ult?.resumo || t.relato || "-"; const usuario = ult ? obterUsuario(ult.usuario_id) : obterUsuario(t.relato_usuario_id); const data = ult?.data_tentativa || t.relato_atualizado_em; return `<div>${esc(texto)}</div><span style="color:var(--muted);font-size:12px">${esc(usuario?.nome || "Sem autor")} · ${dataBR(data)}</span>`; }
function responsaveis(t) { const rows = [[t.responsavel_1_nome, t.responsavel_1_email, t.responsavel_1_whatsapp || t.responsavel_1_telefone], [t.responsavel_2_nome, t.responsavel_2_email, t.responsavel_2_whatsapp || t.responsavel_2_telefone]].filter(r => r.some(Boolean)); return rows.length ? rows.map(r => `<div><strong>${esc(r[0] || "Responsavel")}</strong><br><span style="color:var(--muted)">${esc([r[1], r[2]].filter(Boolean).join(" · ") || "-")}</span></div>`).join("") : `<span style="color:var(--muted)">Sem responsavel</span>`; }

function renderTeatros() {
  const f = appState.filtrosTeatros;
  const cidades = cidadesDoEstado(f.estado_id);
  const teatros = filtrarTeatros();
  return `<div class="toolbar"><div></div><button class="btn" onclick="abrirTeatro()">Novo teatro</button></div><section class="panel"><div class="panel-header"><h2>Teatros</h2><span class="badge">${teatros.length} registros</span></div><div class="panel-body"><div class="filters"><input placeholder="Buscar por nome, cidade, responsavel ou relato" value="${esc(f.busca)}" oninput="filtroTeatro('busca',this.value)"><select onchange="filtroTeatro('estado_id',this.value)">${opcoes(banco.estados, f.estado_id, "Estado")}</select><select onchange="filtroTeatro('cidade_id',this.value)">${opcoes(cidades, f.cidade_id, "Cidade")}</select><select onchange="filtroTeatro('situacao',this.value)">${opcoesEnum(["PROSPECTO", "ATIVO", "INATIVO", "SEM_INTERESSE", "CONTATAR_DEPOIS"], f.situacao, "Situacao")}</select></div></div><div class="table-wrap">${tabelaTeatros(teatros)}</div></section>`;
}
function filtrarTeatros() { const f = appState.filtrosTeatros; return teatrosPermitidos().filter(t => { const texto = norm(`${t.nome} ${t.relato} ${t.responsavel_1_nome} ${t.responsavel_1_email} ${obterCidade(t.cidade_id)?.nome} ${obterEstado(t.estado_id)?.uf}`); return (!f.busca || texto.includes(norm(f.busca))) && (!f.estado_id || t.estado_id === f.estado_id) && (!f.cidade_id || t.cidade_id === f.cidade_id) && (!f.situacao || t.situacao === f.situacao) && (!f.prioridade || t.prioridade === f.prioridade); }); }
function tabelaTeatros(teatros) { if (!teatros.length) return `<div class="empty">Nenhum teatro encontrado.</div>`; return `<table><thead><tr><th>Teatro</th><th>Responsaveis</th><th>Cidade/UF</th><th>Proximo contato</th><th>Relevancia</th><th>Acoes</th></tr></thead><tbody>${teatros.map(t => `<tr><td><button class="link-button" onclick="verTeatro('${t.id}')">${esc(t.nome)}</button><br><span style="color:var(--muted)">${esc(t.email || t.telefone || "-")}</span></td><td>${responsaveis(t)}</td><td>${esc(obterCidade(t.cidade_id)?.nome || "-")}/${esc(obterEstado(t.estado_id)?.uf || "-")}</td><td>${badgeData(t.proximo_contato_em)}</td><td><span class="badge ${badgeClasse(t.prioridade)}">${rotulo(t.prioridade)}</span></td><td><div class="actions"><button class="btn secondary small" onclick="abrirTeatro('${t.id}')">Editar</button><button class="btn small" onclick="abrirContatoRealizado('', '${t.id}')">Fazer contato</button></div></td></tr>`).join("")}</tbody></table>`; }

function renderDetalheTeatro() {
  const t = obterTeatro(appState.teatroSelecionadoId);
  if (!t) { appState.teatroSelecionadoId = null; return renderTeatros(); }
  const historico = banco.tentativas_contato.filter(x => x.teatro_id === t.id).sort((a, b) => b.data_tentativa.localeCompare(a.data_tentativa));
  return `<div class="toolbar"><button class="btn secondary" onclick="voltarTeatros()">Voltar</button><div class="toolbar-actions"><button class="btn secondary" onclick="abrirTeatro('${t.id}')">Editar teatro</button><button class="btn" onclick="abrirContatoRealizado('', '${t.id}')">Fazer contato</button></div></div><div class="detail-grid"><div class="grid"><section class="panel"><div class="panel-header"><h2>${esc(t.nome)}</h2></div><div class="panel-body"><div class="kv">${kv("Cidade", `${obterCidade(t.cidade_id)?.nome || "-"} / ${obterEstado(t.estado_id)?.uf || "-"}`)}${kv("Situacao", rotulo(t.situacao))}${kv("Relevancia", rotulo(t.prioridade))}${kv("Proximo contato", dataBR(t.proximo_contato_em))}${kv("Capacidade", t.capacidade || "-")}${kv("E-mail", t.email || "-")}</div></div></section><section class="panel"><div class="panel-header"><h3>Relato</h3></div><div class="panel-body"><p style="margin:0 0 10px">${esc(t.relato || "Sem relato cadastrado.")}</p><span style="color:var(--muted);font-size:12px">Registrado por ${esc(obterUsuario(t.relato_usuario_id)?.nome || "Sem autor")} em ${dataBR(t.relato_atualizado_em)}</span></div></section><section class="panel"><div class="panel-header"><h3>Historico de contatos realizados</h3></div><div class="panel-body">${historico.length ? `<div class="timeline">${historico.map(h => `<div class="timeline-item"><strong>${dataBR(h.data_tentativa)} · ${rotulo(h.canal)} · ${rotulo(h.resultado)}</strong><span>${esc(h.resumo || "-")}</span><span>Proximo contato: ${dataBR(h.proximo_contato_em)}</span><span>Registrado por: ${esc(obterUsuario(h.usuario_id)?.nome || "Sem autor")}</span></div>`).join("")}</div>` : `<div class="empty">Sem contatos realizados.</div>`}</div></section></div><aside class="grid"><section class="panel"><div class="panel-header"><h3>Responsavel 1</h3></div><div class="panel-body"><div class="kv">${kv("Nome", t.responsavel_1_nome || "-")}${kv("E-mail", t.responsavel_1_email || "-")}${kv("Telefone", t.responsavel_1_whatsapp || t.responsavel_1_telefone || "-")}</div></div></section><section class="panel"><div class="panel-header"><h3>Responsavel 2</h3></div><div class="panel-body"><div class="kv">${kv("Nome", t.responsavel_2_nome || "-")}${kv("E-mail", t.responsavel_2_email || "-")}${kv("Telefone", t.responsavel_2_whatsapp || t.responsavel_2_telefone || "-")}</div></div></section></aside></div>`;
}
function kv(k, v) { return `<div><span>${k}</span><strong>${esc(v)}</strong></div>`; }

function renderRelatorios() { const teatros = teatrosPermitidos(); const semContato = teatros.filter(t => !banco.tentativas_contato.some(c => c.teatro_id === t.id)); return `<div class="grid cols-2"><section class="panel"><div class="panel-header"><h2>Resumo</h2></div><div class="panel-body"><div class="kv">${kv("Teatros", teatros.length)}${kv("Sem contato", semContato.length)}${kv("Alta relevancia", teatros.filter(t => t.prioridade === "ALTA").length)}${kv("Contatos feitos", banco.tentativas_contato.length)}</div></div></section><section class="panel"><div class="panel-header"><h2>Teatros sem contato</h2></div><div class="table-wrap">${tabelaTeatros(semContato)}</div></section></div>`; }
function renderUsuarios() { if (!podeAdministrar()) return `<div class="empty">Acesso restrito.</div>`; return `<div class="toolbar"><div></div><button class="btn" onclick="abrirUsuario()">Novo usuario</button></div><section class="panel"><div class="panel-header"><h2>Usuarios</h2></div><div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Acoes</th></tr></thead><tbody>${banco.usuarios.map(u => `<tr><td><strong>${esc(u.nome)}</strong></td><td>${esc(u.email)}</td><td><span class="badge ${badgeClasse(u.perfil)}">${rotulo(u.perfil)}</span></td><td>${u.ativo ? "Ativo" : "Inativo"}</td><td><button class="btn secondary small" onclick="abrirUsuario('${u.id}')">Editar</button></td></tr>`).join("")}</tbody></table></div></section>`; }

function opcoes(lista, sel = "", vazio = "Todos") { return `<option value="">${vazio}</option>` + lista.map(i => `<option value="${i.id}" ${i.id === sel ? "selected" : ""}>${esc(i.nome)}</option>`).join(""); }
function opcoesEnum(lista, sel = "", vazio = "Todos") { return `<option value="">${vazio}</option>` + lista.map(i => `<option value="${i}" ${i === sel ? "selected" : ""}>${rotulo(i)}</option>`).join(""); }
function campo(nome, label, valor = "", req = false, tipo = "text") { return `<label>${label}<input name="${nome}" type="${tipo}" value="${esc(valor || "")}" ${req ? "required" : ""}></label>`; }
function area(nome, label, valor = "") { return `<label class="full">${label}<textarea name="${nome}">${esc(valor || "")}</textarea></label>`; }
function rodape() { return `<div class="modal-footer"><button class="btn secondary" type="button" onclick="fecharModal()">Cancelar</button><button class="btn" type="submit">Salvar</button></div>`; }
function modal(html) { appState.modal = `<div class="modal-backdrop" onclick="fecharModalFundo(event)">${html}</div>`; renderizar(); }
function fecharModal() { appState.modal = ""; renderizar(); }
function fecharModalFundo(e) { if (e.target.classList.contains("modal-backdrop")) fecharModal(); }

function abrirTeatro(tid = "") {
  const t = tid ? obterTeatro(tid) : {};
  const cidades = cidadesDoEstado(t.estado_id || "");
  modal(`<form class="modal" onsubmit="salvarTeatro(event,'${tid}')"><h2>${tid ? "Editar teatro" : "Novo teatro"}</h2><p>Dados essenciais para contato, acompanhamento e priorizacao comercial.</p><div class="form-grid">${campo("nome", "Nome", t.nome, true)}${campo("email", "E-mail", t.email, false, "email")}${campo("telefone", "Telefone", t.telefone)}${campo("whatsapp", "WhatsApp", t.whatsapp)}${campo("site", "Site", t.site)}${campo("instagram", "Instagram", t.instagram)}${campo("logradouro", "Logradouro", t.logradouro)}${campo("numero", "Numero", t.numero)}${campo("bairro", "Bairro", t.bairro)}${campo("capacidade", "Capacidade", t.capacidade, false, "number")}<label>Estado<select name="estado_id" required onchange="atualizarCidadesModal(this.value)">${opcoes(banco.estados, t.estado_id || "", "Selecione")}</select></label><label>Cidade<select name="cidade_id" id="modal_cidade_id" required>${opcoes(cidades, t.cidade_id || "", "Selecione")}</select></label><label>Situacao<select name="situacao" required>${opcoesEnum(["PROSPECTO", "ATIVO", "INATIVO", "SEM_INTERESSE", "CONTATAR_DEPOIS"], t.situacao || "PROSPECTO", "Selecione")}</select></label><label>Relevancia<select name="prioridade" required>${opcoesEnum(["BAIXA", "MEDIA", "ALTA"], t.prioridade || "MEDIA", "Selecione")}</select></label>${campo("proximo_contato_em", "Proximo contato", t.proximo_contato_em || hojeIso(), true, "date")}<div></div><div class="form-section-title">Responsavel 1</div>${campo("responsavel_1_nome", "Nome", t.responsavel_1_nome)}${campo("responsavel_1_email", "E-mail", t.responsavel_1_email, false, "email")}${campo("responsavel_1_telefone", "Telefone", t.responsavel_1_telefone)}${campo("responsavel_1_whatsapp", "WhatsApp", t.responsavel_1_whatsapp)}<div class="form-section-title">Responsavel 2</div>${campo("responsavel_2_nome", "Nome", t.responsavel_2_nome)}${campo("responsavel_2_email", "E-mail", t.responsavel_2_email, false, "email")}${campo("responsavel_2_telefone", "Telefone", t.responsavel_2_telefone)}${campo("responsavel_2_whatsapp", "WhatsApp", t.responsavel_2_whatsapp)}${area("relato", "Relato", t.relato)}</div>${rodape()}</form>`);
}
function abrirContatoRealizado(cid = "", tid = "") { const c = cid ? banco.tentativas_contato.find(x => x.id === cid) : { teatro_id: tid, data_tentativa: `${hojeIso()}T09:00` }; modal(`<form class="modal narrow" onsubmit="salvarContatoRealizado(event,'${cid}')"><h2>${cid ? "Editar contato realizado" : "Fazer contato"}</h2><p>Registre o que aconteceu e defina quando este teatro deve voltar para a fila.</p><div class="form-grid"><label class="full">Teatro<select name="teatro_id" required>${opcoes(teatrosPermitidos().map(t => ({ id: t.id, nome: t.nome })), c.teatro_id || tid, "Selecione")}</select></label>${campo("data_tentativa", "Data da tentativa", c.data_tentativa, true, "datetime-local")}<label>Canal<select name="canal" required>${opcoesEnum(["EMAIL", "TELEFONE", "WHATSAPP", "INSTAGRAM", "PRESENCIAL", "OUTRO"], c.canal || "", "Selecione")}</select></label><label>Resultado<select name="resultado" required>${opcoesEnum(["SEM_RESPOSTA", "RESPONDEU", "INTERESSADO", "SEM_INTERESSE", "SOLICITOU_RETORNO", "AGENDA_ABRE_DEPOIS"], c.resultado || "", "Selecione")}</select></label>${campo("proximo_contato_em", "Proximo contato", c.proximo_contato_em || "", true, "date")}${area("resumo", "Resumo", c.resumo)}</div>${rodape()}</form>`); }
function abrirUsuario(uid = "") { const u = uid ? obterUsuario(uid) : {}; modal(`<form class="modal narrow" onsubmit="salvarUsuario(event,'${uid}')"><h2>${uid ? "Editar usuario" : "Novo usuario"}</h2><div class="form-grid">${campo("nome", "Nome", u.nome, true)}${campo("email", "E-mail", u.email, true, "email")}${campo("senha", "Senha", u.senha, !uid, "password")}<label>Perfil<select name="perfil" required>${opcoesEnum(["ADMINISTRADOR", "OPERADOR"], u.perfil || "OPERADOR", "Selecione")}</select></label><label>Ativo<select name="ativo"><option value="true" ${u.ativo !== false ? "selected" : ""}>Sim</option><option value="false" ${u.ativo === false ? "selected" : ""}>Nao</option></select></label></div>${rodape()}</form>`); }

function formDados(form) { return Object.fromEntries(new FormData(form).entries()); }
function salvarTeatro(e, tid) { e.preventDefault(); const d = formDados(e.target); const agora = agoraIso(); const payload = { ...d, capacidade: Number(d.capacidade || 0), data_atualizacao: agora }; if (tid) { const i = banco.teatros.findIndex(t => t.id === tid); if ((banco.teatros[i].relato || "") !== (payload.relato || "")) { payload.relato_usuario_id = usuarioAtual().id; payload.relato_atualizado_em = agora; } banco.teatros[i] = { ...banco.teatros[i], ...payload }; } else { banco.teatros.unshift({ id: id("teatro"), ...payload, usuario_responsavel_id: usuarioAtual().id, criado_por_usuario_id: usuarioAtual().id, relato_usuario_id: usuarioAtual().id, relato_atualizado_em: agora, data_criacao: agora, data_atualizacao: agora }); } salvarBanco(banco); fecharModal(); toast("Teatro salvo com sucesso."); }
function salvarContatoRealizado(e, cid) { e.preventDefault(); const d = { ...formDados(e.target), usuario_id: usuarioAtual().id, data_atualizacao: agoraIso() }; const t = obterTeatro(d.teatro_id); if (t) { t.proximo_contato_em = d.proximo_contato_em; t.data_atualizacao = agoraIso(); } if (cid) { const i = banco.tentativas_contato.findIndex(x => x.id === cid); banco.tentativas_contato[i] = { ...banco.tentativas_contato[i], ...d }; } else { banco.tentativas_contato.unshift({ id: id("contato"), ...d, data_criacao: agoraIso() }); } salvarBanco(banco); fecharModal(); toast("Contato salvo com sucesso."); }
function salvarUsuario(e, uid) { e.preventDefault(); const d = formDados(e.target); if (!podeAdministrar()) return; const payload = { nome: d.nome, email: d.email, perfil: d.perfil, ativo: d.ativo === "true" }; if (d.senha) payload.senha = d.senha; if (uid) { const i = banco.usuarios.findIndex(u => u.id === uid); banco.usuarios[i] = { ...banco.usuarios[i], ...payload }; } else { banco.usuarios.push({ id: id("usuario"), ...payload, ultimo_acesso_em: "" }); } salvarBanco(banco); fecharModal(); toast("Usuario salvo com sucesso."); }

function entrar(e) { e.preventDefault(); const d = formDados(e.target); const u = banco.usuarios.find(x => x.email.toLowerCase() === d.email.toLowerCase() && x.senha === d.senha && x.ativo); if (!u) { toast("E-mail ou senha invalidos."); return; } u.ultimo_acesso_em = agoraIso(); salvarBanco(banco); sessionStorage.setItem(SESSION_KEY, u.id); appState.rota = "dashboard"; renderizar(); }
function sair() { sessionStorage.removeItem(SESSION_KEY); appState.teatroSelecionadoId = null; renderizar(); }
function navegar(rota) { if (usuarioAtual()?.perfil !== "ADMINISTRADOR" && !["dashboard", "teatros"].includes(rota)) rota = "dashboard"; appState.rota = rota; appState.teatroSelecionadoId = null; appState.sidebarAberta = false; renderizar(); }
function verTeatro(tid) { appState.teatroSelecionadoId = tid; renderizar(); }
function voltarTeatros() { appState.teatroSelecionadoId = null; appState.rota = "teatros"; renderizar(); }
function filtroDash(c, v) { appState.filtrosDashboard[c] = v; renderizar(); }
function filtroTeatro(c, v) { appState.filtrosTeatros[c] = v; if (c === "estado_id") appState.filtrosTeatros.cidade_id = ""; renderizar(); }
function atualizarCidadesModal(eid) { const s = document.getElementById("modal_cidade_id"); if (s) s.innerHTML = opcoes(cidadesDoEstado(eid), "", "Selecione"); }
function alternarMenu() { appState.sidebarAberta = !appState.sidebarAberta; renderizar(); }
function resetarDados() { if (!confirm("Restaurar dados iniciais? Os cadastros feitos nesta demonstracao serao apagados.")) return; banco = bancoInicial(); salvarBanco(banco); sessionStorage.removeItem(SESSION_KEY); appState.rota = "dashboard"; appState.teatroSelecionadoId = null; appState.modal = ""; renderizar(); }
function toast(msg) { const old = document.querySelector(".toast"); if (old) old.remove(); const el = document.createElement("div"); el.className = "toast"; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }

renderizar();
