(function () {
    if (localStorage.getItem("usuarioLogado") !== "master") {
        window.location.href = "/html/menu.html";
        return;
    }

    const atual = document.getElementById("codigo-atual-master");
    const novo = document.getElementById("novo-codigo-master");
    const confirmar = document.getElementById("confirmar-codigo-master");
    const aviso = document.getElementById("mensagem-codigo");

    function mostrar(texto, tipo) {
        aviso.textContent = texto;
        aviso.className = "mensagem " + tipo;
    }

    async function salvar() {
        if (!atual.value || !novo.value || !confirmar.value) {
            mostrar("Preencha todos os campos.", "erro");
            return;
        }
        if (novo.value !== confirmar.value) {
            mostrar("A confirmação não confere com o novo código.", "erro");
            return;
        }

        try {
            const resposta = await apiFetch("/api/master/codigo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codigoAtual: atual.value, novoCodigo: novo.value })
            });
            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                mostrar(dados.mensagem || "Não foi possível alterar o código.", "erro");
                return;
            }

            atual.value = "";
            novo.value = "";
            confirmar.value = "";
            mostrar(dados.mensagem, "sucesso");
        } catch (erro) {
            mostrar("Erro ao conectar com o servidor.", "erro");
        }
    }

    document.getElementById("btn-salvar-codigo").addEventListener("click", salvar);
})();
