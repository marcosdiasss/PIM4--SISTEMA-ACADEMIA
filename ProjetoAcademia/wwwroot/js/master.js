(function () {
    if (localStorage.getItem("usuarioLogado") !== "master") {
        window.location.href = "/html/menu.html";
        return;
    }

    const status = document.getElementById("status-admin");
    const botao = document.getElementById("btn-bloqueio");
    const aviso = document.getElementById("mensagem-master");

    function mostrar(texto, tipo) {
        aviso.textContent = texto;
        aviso.className = "mensagem " + tipo;
    }

    function desenhar(bloqueado) {
        status.textContent = bloqueado ? "Bloqueado" : "Desbloqueado";
        status.className = "selo " + (bloqueado ? "selo-cancelada" : "selo-ativa");
        botao.textContent = bloqueado ? "Desbloquear administrador" : "Bloquear administrador";
    }

    async function carregar() {
        try {
            const resposta = await apiFetch("/api/master/admin");
            if (!resposta.ok) throw new Error("falha");
            const dados = await resposta.json();
            desenhar(dados.bloqueado);
        } catch (erro) {
            status.textContent = "Indisponível";
            mostrar("Não foi possível carregar o status do administrador.", "erro");
        }
    }

    async function alternar() {
        try {
            const resposta = await apiFetch("/api/master/admin/bloqueio", { method: "POST" });
            if (!resposta.ok) throw new Error("falha");
            const dados = await resposta.json();
            desenhar(dados.bloqueado);
            mostrar(dados.bloqueado ? "Administrador bloqueado." : "Administrador desbloqueado.", "sucesso");
        } catch (erro) {
            mostrar("Não foi possível alterar o bloqueio.", "erro");
        }
    }

    botao.addEventListener("click", alternar);
    carregar();
})();
