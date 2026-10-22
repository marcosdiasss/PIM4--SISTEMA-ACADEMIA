async function apiFetch(url, opcoes = {}) {
    const token = localStorage.getItem("token");
    const headers = { ...(opcoes.headers || {}) };
    if (token) headers["Authorization"] = "Bearer " + token;
    const resposta = await fetch(url, { ...opcoes, headers });
    if (resposta.status === 401 && !url.includes("/api/auth/login")) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuarioLogado");
        window.location.href = "/html/login.html";
    }
    return resposta;
}

async function obterAlunos() {
    try {
        const resposta = await apiFetch("/api/matriculas");
        if (!resposta.ok) return [];
        return await resposta.json();
    } catch {
        return [];
    }
}

function formatarData(data) {
    if (!data) return "";
    const texto = String(data).substring(0, 10);
    const partes = texto.split("-");
    if (partes.length !== 3) return texto;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function mostrarMensagem(texto, tipo = "erro") {
    const caixa =
        document.getElementById("mensagem-cadastro") ||
        document.getElementById("mensagem-lista") ||
        document.getElementById("mensagem-perfil") ||
        document.getElementById("mensagem-edicao") ||
        document.getElementById("erro-login");

    if (!caixa) return;

    caixa.classList.remove("erro", "sucesso");
    caixa.classList.add(tipo === "sucesso" ? "sucesso" : "erro");
    caixa.innerText = texto;
}

function aplicarMascaraCpf(valor) {
    return valor
        .replace(/\D/g, "")
        .substring(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function aplicarMascaraTelefone(valor) {
    const nums = valor.replace(/\D/g, "").substring(0, 11);
    if (nums.length <= 10) {
        return nums
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return nums
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

function validarCpf(cpf) {
    const nums = cpf.replace(/\D/g, "");
    if (nums.length !== 11 || /^(\d)\1+$/.test(nums)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(nums[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(nums[10]);
}

function iniciarMascaras() {
    const cpfInput = document.getElementById("cpf");
    if (cpfInput) {
        cpfInput.addEventListener("input", function () {
            this.value = aplicarMascaraCpf(this.value);
        });
    }

    const telefoneInput = document.getElementById("telefone");
    if (telefoneInput) {
        telefoneInput.addEventListener("input", function () {
            this.value = aplicarMascaraTelefone(this.value);
        });
    }
}

async function login() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!usuario || !senha) {
        mostrarMensagem("Preencha usuário e senha.");
        return;
    }

    try {
        const resposta = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login: usuario, senha: senha })
        });

        if (!resposta.ok) {
            const dados = await resposta.json().catch(() => ({}));
            mostrarMensagem(dados.mensagem || "Usuário ou senha inválidos.");
            return;
        }

        const dados = await resposta.json();
        localStorage.setItem("usuarioLogado", dados.tipo);
        localStorage.setItem("token", dados.token);
        window.location.href = "/html/menu.html";

    } catch {
        mostrarMensagem("Erro ao conectar ao servidor.");
    }
}

async function cadastrar() {
    const nomeInput = document.getElementById("nome");
    const dataInput = document.getElementById("dataNascimento");
    const cpfInput = document.getElementById("cpf");
    const telefoneInput = document.getElementById("telefone");
    const planoInput = document.getElementById("plano");
    const pagamentoInput = document.getElementById("pagamento");

    if (!nomeInput || !dataInput || !planoInput || !pagamentoInput) {
        mostrarMensagem("Campos obrigatórios não encontrados.");
        return;
    }

    const nome = nomeInput.value.trim();
    const dataNascimento = dataInput.value.trim();
    const cpf = cpfInput?.value.trim() ?? "";
    const telefone = telefoneInput?.value.trim() ?? "";
    const plano = planoInput.value;
    const pagamento = pagamentoInput.value;
    const dataInicio = document.getElementById("dataInicio")?.value || "";

    if (!nome || !dataNascimento || !plano || !pagamento || !dataInicio) {
        mostrarMensagem("Preencha nome, data de nascimento, plano, pagamento e data de início.");
        return;
    }

    const dataObj = new Date(dataNascimento + "T00:00:00");
    const anoNascimento = dataObj.getFullYear();
    if (isNaN(dataObj.getTime()) || anoNascimento < 1900 || anoNascimento > new Date().getFullYear()) {
        mostrarMensagem("Data de nascimento inválida.");
        return;
    }

    if (dataObj > new Date()) {
        mostrarMensagem("Data de nascimento não pode ser no futuro.");
        return;
    }

    if (cpf && !validarCpf(cpf)) {
        mostrarMensagem("CPF inválido. Verifique os dígitos informados.");
        return;
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    if (telefone && (telefoneLimpo.length < 10 || telefoneLimpo.length > 11)) {
        mostrarMensagem("Telefone inválido. Use o formato (XX) XXXXX-XXXX.");
        return;
    }

    let dataFormatada = dataNascimento;
    if (dataNascimento.includes("/")) {
        const [dia, mes, ano] = dataNascimento.split("/");
        dataFormatada = `${ano}-${mes}-${dia}`;
    }

    const payload = {
        nome: nome,
        cpf: cpf.replace(/\D/g, ""),
        telefone: telefone.replace(/\D/g, ""),
        dataNascimento: dataFormatada,
        idPlano: parseInt(plano),
        dataInicio: dataInicio,
        formaPagamento: pagamento
    };

    try {
        const resposta = await apiFetch("/api/matriculas/cadastrar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            mostrarMensagem(dados.mensagem || dados.detalhe || "Erro ao cadastrar matrícula.");
            return;
        }

        mostrarMensagem("Aluno cadastrado com sucesso!", "sucesso");

        nomeInput.value = "";
        dataInput.value = "";
        if (cpfInput) cpfInput.value = "";
        if (telefoneInput) telefoneInput.value = "";
        planoInput.value = "";
        pagamentoInput.value = "";
        limparSelectsPersonalizados();

    } catch (erro) {
        console.error(erro);
        mostrarMensagem("Erro ao conectar com o servidor.");
    }
}

async function carregarEdicao() {
    const alunos = await obterAlunos();
    const id = parseInt(localStorage.getItem("alunoPerfil"));
    const aluno = alunos.find(a => (a.idAluno || a.id) === id);
    if (!aluno) return;

    const nomeInput = document.getElementById("nome");
    const dataInput = document.getElementById("dataNascimento");
    const cpfInput = document.getElementById("cpf");
    const telefoneInput = document.getElementById("telefone");
    const planoInput = document.getElementById("plano");
    const pagamentoInput = document.getElementById("pagamento");

    if (nomeInput) nomeInput.value = aluno.nome || "";
    if (cpfInput) cpfInput.value = aluno.cpf || "";
    if (telefoneInput) telefoneInput.value = aluno.telefone || "";

    if (dataInput && aluno.dataNascimento) {
        dataInput.value = String(aluno.dataNascimento).substring(0, 10);
    }

    if (planoInput && aluno.idPlano) {
        planoInput.value = String(aluno.idPlano);
        const opcaoPlano = document.querySelector(
            `[data-action="selecionar-opcao-custom"][data-value="${aluno.idPlano}"]`
        );
        if (opcaoPlano) {
            const selectWrapper = opcaoPlano.closest("[data-select-custom]");
            const textoEl = selectWrapper?.querySelector("[data-select-text]");
            if (textoEl) textoEl.innerText = opcaoPlano.innerText.trim();
            opcaoPlano.classList.add("selecionado");
            opcaoPlano.setAttribute("aria-selected", "true");
        }
    }

    if (pagamentoInput && aluno.pagamento) {
        pagamentoInput.value = aluno.pagamento;
        const opcaoPagamento = document.querySelector(
            `[data-action="selecionar-opcao-custom"][data-value="${aluno.pagamento}"]`
        );
        if (opcaoPagamento) {
            const selectWrapper = opcaoPagamento.closest("[data-select-custom]");
            const textoEl = selectWrapper?.querySelector("[data-select-text]");
            if (textoEl) textoEl.innerText = opcaoPagamento.innerText.trim();
            opcaoPagamento.classList.add("selecionado");
            opcaoPagamento.setAttribute("aria-selected", "true");
        }
    }

    localStorage.setItem("alunoEdicaoId", aluno.idAluno || aluno.id);
}

async function salvarEdicao() {
    const id = parseInt(localStorage.getItem("alunoEdicaoId"));
    if (!id) {
        mostrarMensagem("Aluno não identificado para edição.");
        return;
    }

    const nomeInput = document.getElementById("nome");
    const dataInput = document.getElementById("dataNascimento");
    const cpfInput = document.getElementById("cpf");
    const telefoneInput = document.getElementById("telefone");
    const planoInput = document.getElementById("plano");
    const pagamentoInput = document.getElementById("pagamento");

    const nome = nomeInput?.value.trim() ?? "";
    const dataNascimento = dataInput?.value.trim() ?? "";
    const cpf = cpfInput?.value.trim() ?? "";
    const telefone = telefoneInput?.value.trim() ?? "";

    if (!nome || !dataNascimento) {
        mostrarMensagem("Preencha nome e data de nascimento.");
        return;
    }

    let dataFormatada = dataNascimento;
    if (dataNascimento.includes("/")) {
        const [dia, mes, ano] = dataNascimento.split("/");
        dataFormatada = `${ano}-${mes}-${dia}`;
    }

    const payload = {
        nome: nome,
        cpf: cpf,
        telefone: telefone,
        dataNascimento: dataFormatada,
        email: ""
    };

    try {
        const resposta = await apiFetch(`/api/alunos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            mostrarMensagem(dados.mensagem || "Erro ao salvar alterações.");
            return;
        }

        mostrarMensagem("Aluno atualizado com sucesso!", "sucesso");
        setTimeout(() => { window.location.href = "/html/lista.html"; }, 1200);

    } catch (erro) {
        console.error(erro);
        mostrarMensagem("Erro ao conectar com o servidor.");
    }
}

async function carregarLista() {
    const tabela = document.getElementById("listaAlunos");
    if (!tabela) return;

    try {
        const alunos = await obterAlunos();
        tabela.innerHTML = "";

        alunos.forEach((aluno, index) => {
            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${index + 1}</td>
                <td>${aluno.nome || ""}</td>
                <td>${formatarData(aluno.dataNascimento)}</td>
                <td>${aluno.telefone || ""}</td>
                <td>${aluno.cpf || ""}</td>
                <td>${aluno.plano || "—"}</td>
                <td>${formatarData(aluno.dataInicio)}</td>
                <td>${aluno.pagamento || "—"}</td>
                <td>
                    <button onclick="verPerfil(${aluno.idAluno || aluno.id})">
                        Visualizar perfil
                    </button>
                </td>
            `;
            tabela.appendChild(linha);
        });

        const campoBusca = document.getElementById("busca");
        if (campoBusca) {
            campoBusca.addEventListener("input", function () {
                const termo = this.value.toLowerCase();
                tabela.querySelectorAll("tr").forEach(linha => {
                    const texto = linha.innerText.toLowerCase();
                    linha.style.display = texto.includes(termo) ? "" : "none";
                });
            });
        }
    } catch (erro) {
        console.error(erro);
        mostrarMensagem("Erro ao carregar alunos.");
    }
}

function verPerfil(id) {
    localStorage.setItem("alunoPerfil", id);
    window.location.href = "/html/perfil.html";
}

async function carregarPerfil() {
    const alunos = await obterAlunos();
    const id = parseInt(localStorage.getItem("alunoPerfil"));
    const aluno = alunos.find(a => (a.idAluno || a.id) === id);

    if (!aluno) return;

    const nome = document.getElementById("perfilNome");
    const data = document.getElementById("perfilData");
    const cpf = document.getElementById("perfilCpf");
    const telefone = document.getElementById("perfilTelefone");
    const plano = document.getElementById("perfilPlano");
    const pagamento = document.getElementById("perfilPagamento");

    if (nome) nome.innerText = aluno.nome || "";
    if (data) data.innerText = formatarData(aluno.dataNascimento);
    if (cpf) cpf.innerText = aluno.cpf || "";
    if (telefone) telefone.innerText = aluno.telefone || "";
    if (plano) plano.innerText = aluno.plano || "";
    if (pagamento) pagamento.innerText = aluno.pagamento || "";

    const btnEditar = document.getElementById("btnEditar");
    if (btnEditar) {
        btnEditar.addEventListener("click", function () {
            window.location.href = "/html/editar.html";
        });
    }
}

async function carregarHistorico() {
    const alunos = await obterAlunos();

    const totalEl = document.getElementById("relatorioTotal");
    if (totalEl) totalEl.innerText = alunos.length;

    const contadorPagamento = {};
    alunos.forEach(a => {
        const p = a.pagamento || "Não informado";
        contadorPagamento[p] = (contadorPagamento[p] || 0) + 1;
    });
    const maisUsado = Object.entries(contadorPagamento).sort((a, b) => b[1] - a[1])[0];
    const pagamentoEl = document.getElementById("relatorioPagamento");
    if (pagamentoEl) pagamentoEl.innerText = maisUsado ? maisUsado[0] : "-";

    const contadorPlano = {};
    alunos.forEach(a => {
        const p = a.plano || "Não informado";
        contadorPlano[p] = (contadorPlano[p] || 0) + 1;
    });
    const planoTop = Object.entries(contadorPlano).sort((a, b) => b[1] - a[1])[0];
    const planoEl = document.getElementById("relatorioPlano");
    if (planoEl) planoEl.innerText = planoTop ? planoTop[0] : "-";
}

function gerarDocumentoRelatorio() {
    window.location.href = "/html/relatorio.html";
}

async function carregarRelatorio() {
    const alunos = await obterAlunos();

    const dataEl = document.getElementById("documentoDataGeracao");
    if (dataEl) dataEl.innerText = new Date().toLocaleString("pt-BR");

    const totalEl = document.getElementById("documentoTotal");
    if (totalEl) totalEl.innerText = alunos.length;

    const contadorPagamento = {};
    alunos.forEach(a => {
        const p = a.pagamento || "Não informado";
        contadorPagamento[p] = (contadorPagamento[p] || 0) + 1;
    });
    const maisUsado = Object.entries(contadorPagamento).sort((a, b) => b[1] - a[1])[0];
    const pagamentoEl = document.getElementById("documentoPagamento");
    if (pagamentoEl) pagamentoEl.innerText = maisUsado ? maisUsado[0] : "-";

    const contadorPlano = {};
    alunos.forEach(a => {
        const p = a.plano || "Não informado";
        contadorPlano[p] = (contadorPlano[p] || 0) + 1;
    });
    const planoTop = Object.entries(contadorPlano).sort((a, b) => b[1] - a[1])[0];
    const planoEl = document.getElementById("documentoPlano");
    if (planoEl) planoEl.innerText = planoTop ? planoTop[0] : "-";

    const tbody = document.getElementById("documentoHistorico");
    if (tbody) {
        alunos.forEach((aluno, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatarData(aluno.dataNascimento)}</td>
                <td>Matrícula</td>
                <td>${aluno.nome || ""}</td>
                <td>${aluno.plano || ""} — ${aluno.pagamento || ""}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function logout() {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("token");
    window.location.href = "/html/login.html";
}

function iniciarSelectsPersonalizados() {
    document.querySelectorAll("[data-select-custom]").forEach(select => {
        const botao = select.querySelector("[data-action='alternar-select-custom']");
        const texto = select.querySelector("[data-select-text]");
        const input = select.querySelector("input[type='hidden']");
        const placeholder = select.getAttribute("data-placeholder") || "Selecione";

        if (!botao || !texto || !input) return;

        botao.addEventListener("click", function () {
            const estaAberto = select.classList.contains("aberto");
            fecharSelectsPersonalizados();

            if (!estaAberto) {
                select.classList.add("aberto");
                botao.setAttribute("aria-expanded", "true");
            }
        });

        select.querySelectorAll("[data-action='selecionar-opcao-custom']").forEach(opcao => {
            opcao.addEventListener("click", function () {
                input.value = opcao.getAttribute("data-value") || "";
                texto.innerText = opcao.innerText.trim() || placeholder;

                select.querySelectorAll("[data-action='selecionar-opcao-custom']").forEach(item => {
                    item.classList.remove("selecionado");
                    item.setAttribute("aria-selected", "false");
                });

                opcao.classList.add("selecionado");
                opcao.setAttribute("aria-selected", "true");
                select.classList.remove("aberto");
                botao.setAttribute("aria-expanded", "false");
            });
        });
    });

    document.addEventListener("click", function (evento) {
        if (!evento.target.closest("[data-select-custom]")) {
            fecharSelectsPersonalizados();
        }
    });
}

function fecharSelectsPersonalizados() {
    document.querySelectorAll("[data-select-custom]").forEach(select => {
        select.classList.remove("aberto");
        const botao = select.querySelector("[data-action='alternar-select-custom']");
        if (botao) botao.setAttribute("aria-expanded", "false");
    });
}

function limparSelectsPersonalizados() {
    document.querySelectorAll("[data-select-custom]").forEach(select => {
        const texto = select.querySelector("[data-select-text]");
        const input = select.querySelector("input[type='hidden']");
        const placeholder = select.getAttribute("data-placeholder") || "Selecione";
        if (texto) texto.innerText = placeholder;
        if (input) input.value = "";

        select.querySelectorAll("[data-action='selecionar-opcao-custom']").forEach(item => {
            item.classList.remove("selecionado");
            item.setAttribute("aria-selected", "false");
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const pagina = document.body.dataset.page;
    const usuarioLogado = localStorage.getItem("usuarioLogado");
    document.body.setAttribute("data-autorizado", "true");

    iniciarSelectsPersonalizados();
    iniciarMascaras();

    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", function (e) {
            e.preventDefault();
            login();
        });
    }

    document.querySelectorAll("[data-href]").forEach(botao => {
        botao.addEventListener("click", function () {
            window.location.href = "/html/" + botao.getAttribute("data-href");
        });
    });

    const botaoSair = document.querySelector("[data-action='logout']");
    if (botaoSair) {
        botaoSair.addEventListener("click", function () {
            const modal = document.getElementById("confirmacao-saida");
            if (modal) {
                modal.showModal();
            } else {
                logout();
            }
        });
    }

    document.querySelectorAll("[data-action='fechar-confirmacao-saida']").forEach(btn => {
        btn.addEventListener("click", function () {
            const modal = document.getElementById("confirmacao-saida");
            if (modal) modal.close();
        });
    });

    document.querySelectorAll("[data-action='confirmar-logout']").forEach(btn => {
        btn.addEventListener("click", function () {
            logout();
        });
    });

    document.querySelectorAll("[data-action='toggle-senha']").forEach(btn => {
        btn.addEventListener("click", function () {
            const targetId = btn.getAttribute("data-target") || "senha";
            const input = document.getElementById(targetId);
            if (!input) return;
            if (input.type === "password") {
                input.type = "text";
                btn.classList.replace("bi-eye-slash", "bi-eye");
            } else {
                input.type = "password";
                btn.classList.replace("bi-eye", "bi-eye-slash");
            }
        });
    });

    const esqueciSenha = document.querySelector("[data-action='esqueci-senha']");
    if (esqueciSenha) {
        esqueciSenha.addEventListener("click", function () {
            window.location.href = "/html/codigo-seguranca.html";
        });
    }

    const btnMenu = document.querySelector("[data-action='alternar-menu-rapido']");
    if (btnMenu) {
        btnMenu.addEventListener("click", function () {
            const opcoes = document.getElementById("menu-rapido-opcoes");
            if (!opcoes) return;
            const estaAberto = opcoes.classList.contains("aberto");
            opcoes.classList.toggle("aberto", !estaAberto);
            opcoes.setAttribute("aria-hidden", estaAberto ? "true" : "false");
            btnMenu.setAttribute("aria-expanded", estaAberto ? "false" : "true");
        });

        document.addEventListener("click", function (e) {
            const opcoes = document.getElementById("menu-rapido-opcoes");
            if (opcoes && !btnMenu.contains(e.target) && !opcoes.contains(e.target)) {
                opcoes.classList.remove("aberto");
                opcoes.setAttribute("aria-hidden", "true");
                btnMenu.setAttribute("aria-expanded", "false");
            }
        });
    }

    if (pagina === "menu") {
        const opcaoMaster = document.getElementById("opcao-master");
        if (usuarioLogado === "master" && opcaoMaster) {
            opcaoMaster.classList.remove("opcao-oculta");
        }
    }

    const botaoCadastrar = document.getElementById("btnCadastrar");
    if (botaoCadastrar) {
        botaoCadastrar.addEventListener("click", function (e) {
            e.preventDefault();
            cadastrar();
        });
    }

    document.querySelectorAll("[data-action='cadastrar']").forEach(btn => {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            cadastrar();
        });
    });

    document.querySelectorAll("[data-action='salvar-edicao']").forEach(btn => {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            salvarEdicao();
        });
    });

    document.querySelectorAll("[data-action='imprimir-relatorio']").forEach(btn => {
        btn.addEventListener("click", function () {
            window.print();
        });
    });

    document.querySelectorAll("[data-action='gerar-documento-relatorio']").forEach(btn => {
        btn.addEventListener("click", function () {
            gerarDocumentoRelatorio();
        });
    });

    document.querySelectorAll("[data-action='toggle-ajuda-senha']").forEach(btn => {
        btn.addEventListener("click", function () {
            const ajuda = btn.nextElementSibling;
            if (ajuda && ajuda.classList.contains("ajuda-criterios")) {
                ajuda.classList.toggle("visivel");
            }
        });
    });

    const btnBloqueio = document.querySelector("[data-action='toggle-bloqueio-admin']");
    if (btnBloqueio) {
        const statusEl = document.getElementById("status-admin");
        let adminBloqueado = localStorage.getItem("adminBloqueado") === "true";

        function atualizarStatusAdmin() {
            if (statusEl) statusEl.innerText = adminBloqueado ? "Bloqueado" : "Desbloqueado";
        }

        atualizarStatusAdmin();

        btnBloqueio.addEventListener("click", function () {
            adminBloqueado = !adminBloqueado;
            localStorage.setItem("adminBloqueado", adminBloqueado);
            atualizarStatusAdmin();
        });
    }

    const btnRemoverFoto = document.querySelector("[data-action='remover-foto']");
    if (btnRemoverFoto) {
        btnRemoverFoto.addEventListener("click", function () {
            const fotoAluno = document.getElementById("fotoAluno");
            const iconePadrao = document.getElementById("iconePadrao");
            if (fotoAluno) { fotoAluno.src = ""; fotoAluno.style.display = "none"; }
            if (iconePadrao) iconePadrao.style.display = "";
            btnRemoverFoto.hidden = true;
        });
    }

    const inputFoto = document.getElementById("inputFoto");
    if (inputFoto) {
        inputFoto.addEventListener("change", function () {
            const arquivo = this.files[0];
            if (!arquivo) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                const fotoAluno = document.getElementById("fotoAluno");
                const iconePadrao = document.getElementById("iconePadrao");
                const btnRemover = document.querySelector("[data-action='remover-foto']");
                if (fotoAluno) { fotoAluno.src = e.target.result; fotoAluno.style.display = ""; }
                if (iconePadrao) iconePadrao.style.display = "none";
                if (btnRemover) btnRemover.hidden = false;
            };
            reader.readAsDataURL(arquivo);
        });
    }

    document.querySelectorAll("[data-nav-page]").forEach(btn => {
        btn.addEventListener("click", function () {
            const href = btn.getAttribute("data-href");
            if (href) window.location.href = "/html/" + href;
        });
    });

    if (pagina === "lista") carregarLista();
    if (pagina === "perfil") carregarPerfil();
    if (pagina === "editar") carregarEdicao();
    if (pagina === "historico") carregarHistorico();
    if (pagina === "relatorio-documento") carregarRelatorio();
});

document.addEventListener("DOMContentLoaded", () => {
    const campo = document.getElementById("dataInicio");
    if (campo && !campo.value) campo.value = new Date().toISOString().slice(0, 10);
});
