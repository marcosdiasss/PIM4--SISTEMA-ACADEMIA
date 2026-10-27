(function () {
    const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    const campoInicio = document.getElementById("filtro-inicio");
    const campoFim = document.getElementById("filtro-fim");
    const campoAno = document.getElementById("filtro-ano");
    const aviso = document.getElementById("aviso-relatorios");

    campoAno.value = new Date().getFullYear();

    function mostrarAviso(texto) {
        aviso.textContent = texto;
        aviso.hidden = !texto;
    }

    async function buscar(url) {
        const resposta = await apiFetch(url);
        if (!resposta.ok) throw new Error("falha");
        return resposta.json();
    }

    function mensagemVazia(texto) {
        const vazio = document.createElement("p");
        vazio.className = "vazio";
        vazio.textContent = texto;
        return vazio;
    }

    function desenharBarras(caixaId, itens, textoVazio) {
        const caixa = document.getElementById(caixaId);
        caixa.replaceChildren();

        const comValor = itens.filter(item => item.valor > 0);
        if (comValor.length === 0) {
            caixa.appendChild(mensagemVazia(textoVazio));
            return;
        }

        const maior = Math.max(...comValor.map(item => item.valor));
        comValor.forEach(item => {
            const linha = document.createElement("div");
            linha.className = "barra-linha";

            const rotulo = document.createElement("span");
            rotulo.textContent = item.rotulo;

            const trilho = document.createElement("div");
            trilho.className = "barra-trilho";
            const preenchida = document.createElement("div");
            preenchida.className = "barra-preenchida";
            preenchida.style.width = Math.round((item.valor / maior) * 100) + "%";
            trilho.appendChild(preenchida);

            const valor = document.createElement("span");
            valor.className = "barra-valor";
            valor.textContent = item.valor;

            linha.append(rotulo, trilho, valor);
            caixa.appendChild(linha);
        });
    }

    function desenharMeses(dados) {
        const caixa = document.getElementById("grafico-meses");
        caixa.replaceChildren();

        const totais = Array(12).fill(0);
        dados.forEach(item => { totais[item.mes - 1] = item.total; });

        if (totais.every(total => total === 0)) {
            caixa.appendChild(mensagemVazia("Nenhuma matrícula iniciada neste ano."));
            return;
        }

        const maior = Math.max(...totais);
        totais.forEach((total, indice) => {
            const coluna = document.createElement("div");
            coluna.className = "coluna";

            const area = document.createElement("div");
            area.className = "coluna-area";
            const valor = document.createElement("span");
            valor.className = "coluna-valor";
            valor.textContent = total > 0 ? total : "";
            const barra = document.createElement("div");
            barra.className = "coluna-barra";
            barra.style.height = Math.round((total / maior) * 150) + "px";
            area.append(valor, barra);

            const rotulo = document.createElement("span");
            rotulo.className = "coluna-rotulo";
            rotulo.textContent = MESES[indice];

            coluna.append(area, rotulo);
            caixa.appendChild(coluna);
        });
    }

    function topo(itens) {
        const melhor = [...itens].sort((a, b) => b.valor - a.valor)[0];
        return melhor && melhor.valor > 0 ? melhor.rotulo : "—";
    }

    async function carregar() {
        mostrarAviso("");

        if (campoInicio.value && campoFim.value && campoInicio.value > campoFim.value) {
            mostrarAviso("A data inicial não pode ser maior que a data final.");
            return;
        }

        const filtro = new URLSearchParams();
        if (campoInicio.value) filtro.set("inicio", campoInicio.value);
        if (campoFim.value) filtro.set("fim", campoFim.value);
        const ano = parseInt(campoAno.value, 10) || new Date().getFullYear();

        try {
            const [planos, meses, pagamentos] = await Promise.all([
                buscar("/api/relatorios/planos?" + filtro.toString()),
                buscar("/api/relatorios/mensal?ano=" + ano),
                buscar("/api/relatorios/pagamentos")
            ]);

            const itensPlanos = planos.map(p => ({ rotulo: p.plano, valor: p.totalMatriculas }));
            const itensPagamentos = pagamentos.map(p => ({ rotulo: p.formaPagamento, valor: p.quantidade }));

            desenharBarras("grafico-planos", itensPlanos, "Nenhuma matrícula ativa no período.");
            desenharBarras("grafico-pagamentos", itensPagamentos, "Nenhum pagamento registrado.");
            desenharMeses(meses);

            document.getElementById("kpi-total").textContent = itensPlanos.reduce((soma, item) => soma + item.valor, 0);
            document.getElementById("kpi-plano").textContent = topo(itensPlanos);
            document.getElementById("kpi-pagamento").textContent = topo(itensPagamentos);
        } catch (erro) {
            mostrarAviso("Não foi possível carregar os relatórios agora. Tente novamente em instantes.");
        }
    }

    document.getElementById("btn-aplicar").addEventListener("click", carregar);
    document.getElementById("btn-limpar").addEventListener("click", () => {
        campoInicio.value = "";
        campoFim.value = "";
        campoAno.value = new Date().getFullYear();
        carregar();
    });

    carregar();
})();
