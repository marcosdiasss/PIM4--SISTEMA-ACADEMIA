(function () {
    const aviso = document.getElementById("mensagem-recuperacao");

    function mostrar(texto, tipo) {
        aviso.textContent = texto;
        aviso.className = "mensagem " + tipo;
    }

    async function alterar() {
        const login = document.getElementById("usuario-recuperacao").value.trim();
        const codigo = document.getElementById("codigo-seguranca").value;
        const novaSenha = document.getElementById("nova-senha").value;
        const confirmar = document.getElementById("confirmar-senha").value;

        if (!login || !codigo || !novaSenha || !confirmar) {
            mostrar("Preencha todos os campos.", "erro");
            return;
        }
        if (novaSenha !== confirmar) {
            mostrar("A confirmação não confere com a nova senha.", "erro");
            return;
        }

        try {
            const resposta = await fetch("/api/auth/recuperar-senha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login: login, codigo: codigo, novaSenha: novaSenha })
            });

            if (resposta.status === 429) {
                mostrar("Muitas tentativas. Aguarde alguns minutos e tente novamente.", "erro");
                return;
            }

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                mostrar(dados.mensagem || "Não foi possível alterar a senha.", "erro");
                return;
            }

            mostrar("Senha alterada com sucesso. Redirecionando para o login...", "sucesso");
            setTimeout(() => { window.location.href = "/html/login.html"; }, 1800);
        } catch (erro) {
            mostrar("Erro ao conectar com o servidor.", "erro");
        }
    }

    document.getElementById("btn-alterar-senha").addEventListener("click", alterar);
})();
