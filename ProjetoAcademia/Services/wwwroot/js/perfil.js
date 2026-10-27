(function () {
    const botao = document.getElementById("btn-cancelar-matricula");
    const aviso = document.getElementById("mensagem-perfil");
    let matricula = null;

    function mostrar(texto, tipo) {
        aviso.textContent = texto;
        aviso.className = "mensagem " + tipo;
    }

    async function iniciar() {
        const alunos = await obterAlunos();
        const idAluno = parseInt(localStorage.getItem("alunoPerfil"));
        matricula = alunos.find(a => (a.idAluno || a.id) === idAluno);

        const ehMaster = localStorage.getItem("usuarioLogado") === "master";
        if (matricula && matricula.status === "Ativa" && ehMaster) botao.hidden = false;
    }

    async function cancelarMatricula() {
        if (!matricula || !confirm("Deseja cancelar a matrícula deste aluno?")) return;

        try {
            const resposta = await apiFetch(`/api/matriculas/${matricula.id}/cancelar`, { method: "POST" });
            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                mostrar(dados.mensagem || "Não foi possível cancelar a matrícula.", "erro");
                return;
            }

            document.getElementById("perfilSituacao").innerText = "Cancelada";
            botao.hidden = true;
            mostrar("Matrícula cancelada com sucesso.", "sucesso");
        } catch (erro) {
            mostrar("Erro ao conectar com o servidor.", "erro");
        }
    }

    botao.addEventListener("click", cancelarMatricula);
    iniciar();
})();
