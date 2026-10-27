(function () {
    const hoje = new Date();
    const paraIso = data =>
        `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;

    const hojeIso = paraIso(hoje);
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 30);
    const limiteIso = paraIso(limite);
    const mesAtual = hojeIso.substring(0, 7);

    const nome = localStorage.getItem("nomeUsuario");
    if (nome) document.getElementById("saudacao").textContent = "Bem-vindo, " + nome;

    function texto(valor) {
        return String(valor || "").substring(0, 10);
    }

    function preencherIndicadores(matriculas) {
        const ativas = matriculas.filter(m => m.status === "Ativa");
        const vencem = ativas.filter(m => texto(m.dataFim) >= hojeIso && texto(m.dataFim) <= limiteIso);

        document.getElementById("kpi-ativas").textContent = ativas.length;
        document.getElementById("kpi-mes").textContent = matriculas.filter(m => texto(m.dataInicio).startsWith(mesAtual)).length;
        document.getElementById("kpi-vencem").textContent = vencem.length;
        document.getElementById("kpi-canceladas").textContent = matriculas.filter(m => m.status === "Cancelada").length;
    }

    function desenharPlanos(matriculas) {
        const caixa = document.getElementById("barras-plano");
        const contagem = {};
        matriculas
            .filter(m => m.status === "Ativa")
            .forEach(m => {
                const plano = m.plano || "Não informado";
                contagem[plano] = (contagem[plano] || 0) + 1;
            });

        const planos = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
        caixa.replaceChildren();

        if (planos.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "vazio";
            vazio.textContent = "Nenhuma matrícula ativa ainda.";
            caixa.appendChild(vazio);
            return;
        }

        const maior = planos[0][1];
        planos.forEach(([plano, total]) => {
            const linha = document.createElement("div");
            linha.className = "barra-linha";

            const rotulo = document.createElement("span");
            rotulo.textContent = plano;

            const trilho = document.createElement("div");
            trilho.className = "barra-trilho";
            const preenchida = document.createElement("div");
            preenchida.className = "barra-preenchida";
            preenchida.style.width = Math.round((total / maior) * 100) + "%";
            trilho.appendChild(preenchida);

            const valor = document.createElement("span");
            valor.className = "barra-valor";
            valor.textContent = total;

            linha.append(rotulo, trilho, valor);
            caixa.appendChild(linha);
        });
    }

    function listarRecentes(matriculas) {
        const lista = document.getElementById("lista-recentes");
        lista.replaceChildren();

        const recentes = [...matriculas]
            .sort((a, b) => texto(b.dataInicio).localeCompare(texto(a.dataInicio)) || b.id - a.id)
            .slice(0, 5);

        if (recentes.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "vazio";
            vazio.textContent = "Nenhuma matrícula cadastrada ainda.";
            lista.appendChild(vazio);
            return;
        }

        recentes.forEach(m => {
            const item = document.createElement("li");

            const dados = document.createElement("div");
            const nomeAluno = document.createElement("span");
            nomeAluno.className = "recente-nome";
            nomeAluno.textContent = m.nome;
            const info = document.createElement("span");
            info.className = "recente-info";
            info.textContent = `${m.plano || "Sem plano"} - início em ${formatarData(m.dataInicio)}`;
            dados.append(nomeAluno, info);

            const selo = document.createElement("span");
            selo.className = "selo";
            if (m.status === "Ativa") selo.classList.add("selo-ativa");
            if (m.status === "Cancelada") selo.classList.add("selo-cancelada");
            selo.textContent = m.status;

            item.append(dados, selo);
            lista.appendChild(item);
        });
    }

    async function carregar() {
        const aviso = document.getElementById("aviso-inicio");
        try {
            const resposta = await apiFetch("/api/matriculas");
            if (!resposta.ok) throw new Error("falha");
            const matriculas = await resposta.json();
            preencherIndicadores(matriculas);
            desenharPlanos(matriculas);
            listarRecentes(matriculas);
        } catch (erro) {
            aviso.hidden = false;
        }
    }

    carregar();
})();
