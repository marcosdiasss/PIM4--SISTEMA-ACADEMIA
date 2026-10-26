(function () {
    if (!localStorage.getItem("token")) {
        window.location.href = "/html/login.html";
        return;
    }

    const itens = [
        { href: "menu.html", paginas: ["menu"], icone: "bi-house", texto: "Início" },
        { href: "lista.html", paginas: ["lista", "perfil", "editar"], icone: "bi-people", texto: "Alunos" },
        { href: "cadastro.html", paginas: ["cadastro"], icone: "bi-person-plus", texto: "Nova matrícula" },
        { href: "relatorios.html", paginas: ["relatorios", "relatorio-documento"], icone: "bi-bar-chart", texto: "Relatórios" },
        { href: "master.html", paginas: ["master", "historico"], icone: "bi-shield-lock", texto: "Master", soMaster: true }
    ];

    const paginaAtual = document.body.dataset.page;
    const perfil = localStorage.getItem("usuarioLogado") || "";
    const nome = localStorage.getItem("nomeUsuario") || "Usuário";

    const links = itens
        .filter(item => !item.soMaster || perfil === "master")
        .map(item => {
            const atual = item.paginas.includes(paginaAtual) ? ' aria-current="page"' : "";
            return `<a href="/html/${item.href}"${atual}><i class="bi ${item.icone}" aria-hidden="true"></i>${item.texto}</a>`;
        })
        .join("");

    const lateral = `
        <aside class="side">
            <a class="marca" href="/html/menu.html" aria-label="Prime Fitness Club, início">
                <span class="marca-nome">PRIME</span>
                <span class="marca-sub">FITNESS CLUB</span>
            </a>
            <nav class="menu-lateral" aria-label="Principal">${links}</nav>
            <div class="usuario">
                <div>
                    <span class="usuario-nome" id="usuario-nome"></span>
                    <span class="usuario-perfil" id="usuario-perfil"></span>
                </div>
                <button type="button" class="btn-sair" data-action="logout">
                    <i class="bi bi-box-arrow-right" aria-hidden="true"></i>Sair
                </button>
            </div>
        </aside>`;

    const modalSaida = `
        <dialog class="modal-saida" id="confirmacao-saida" aria-labelledby="titulo-confirmacao-saida">
            <div class="modal-saida-conteudo">
                <h2 id="titulo-confirmacao-saida">Deseja sair da conta?</h2>
                <p>Confirme se deseja encerrar sua sessão no sistema.</p>
                <div class="modal-saida-acoes">
                    <button type="button" class="btn btn-modal-voltar" data-action="fechar-confirmacao-saida">Voltar</button>
                    <button type="button" class="btn btn-modal-sair" data-action="confirmar-logout">Sair</button>
                </div>
            </div>
        </dialog>`;

    document.querySelector(".app").insertAdjacentHTML("afterbegin", lateral);
    document.body.insertAdjacentHTML("beforeend", modalSaida);
    document.getElementById("usuario-nome").textContent = nome;
    document.getElementById("usuario-perfil").textContent = perfil;
})();
