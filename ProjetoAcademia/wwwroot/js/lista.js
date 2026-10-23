(function () {
    const corpo = document.getElementById("tabela-alunos");
    const contador = document.getElementById("contador-alunos");
    const aviso = document.getElementById("aviso-lista");
    const campoBusca = document.getElementById("busca-alunos");
    const chips = document.querySelectorAll("[data-filtro]");

    const hoje = new Date();
    const paraIso = data =>
        `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
    const hojeIso = paraIso(hoje);
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 30);
    const limiteIso = paraIso(limite);

    let matriculas = [];
    let filtroAtual = "todos";

    const texto = valor => String(valor || "").substring(0, 10);

    const vencendo = m =>
        m.status === "Ativa" && texto(m.dataFim) >= hojeIso && texto(m.dataFim) <= limiteIso;

    const filtros = {
        todos: () => true,
        ativas: m => m.status === "Ativa",
        vencem: vencendo,
        canceladas: m => m.status === "Cancelada"
    };

    function celula(conteudo) {
        const td = document.createElement("td");
        if (conteudo instanceof Node) td.appendChild(conteudo);
        else td.textContent = conteudo;
        return td;
    }

    function celulaAluno(m) {
        const caixa = document.createElement("div");
        caixa.className = "celula-nome";
        const nome = document.createElement("strong");
        nome.textContent = m.nome;
        const cpf = document.createElement("small");
        cpf.textContent = m.cpf || "";
        caixa.append(nome, cpf);
        return celula(caixa);
    }

    function celulaStatus(m) {
        const selo = document.createElement("span");
        selo.className = "selo";
        if (m.status === "Cancelada") {
            selo.classList.add("selo-cancelada");
            selo.textContent = "Cancelada";
        } else if (vencendo(m)) {
            selo.classList.add("selo-breve");
            selo.textContent = "Vence em breve";
        } else {
            if (m.status === "Ativa") selo.classList.add("selo-ativa");
            selo.textContent = m.status || "—";
        }
        return celula(selo);
    }

    function celulaAcoes(m) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "link-acao";
        botao.textContent = "Ver perfil";
        botao.addEventListener("click", () => verPerfil(m.idAluno || m.id));
        return celula(botao);
    }

    function desenhar() {
        const termo = campoBusca.value.trim().toLowerCase();
        const lista = matriculas
            .filter(filtros[filtroAtual])
            .filter(m => `${m.nome} ${m.cpf} ${m.plano}`.toLowerCase().includes(termo));

        corpo.replaceChildren();

        if (lista.length === 0) {
            const linha = document.createElement("tr");
            const vazio = celula("Nenhum aluno encontrado.");
            vazio.colSpan = 7;
            linha.appendChild(vazio);
            corpo.appendChild(linha);
        }

        lista.forEach(m => {
            const linha = document.createElement("tr");
            linha.append(
                celulaAluno(m),
                celula(m.plano || "—"),
                celula(formatarData(m.dataInicio) || "—"),
                celula(formatarData(m.dataFim) || "—"),
                celulaStatus(m),
                celula(m.pagamento || "—"),
                celulaAcoes(m)
            );
            corpo.appendChild(linha);
        });

        contador.textContent = `${lista.length} ${lista.length === 1 ? "aluno" : "alunos"}`;
    }

    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            filtroAtual = chip.dataset.filtro;
            chips.forEach(outro => outro.setAttribute("aria-pressed", String(outro === chip)));
            desenhar();
        });
    });

    campoBusca.addEventListener("input", desenhar);

    async function carregar() {
        try {
            const resposta = await apiFetch("/api/matriculas");
            if (!resposta.ok) throw new Error("falha");
            matriculas = await resposta.json();
            desenhar();
        } catch (erro) {
            aviso.hidden = false;
            contador.textContent = "";
        }
    }

    carregar();
})();
