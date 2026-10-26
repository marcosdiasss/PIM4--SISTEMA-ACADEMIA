using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ProjetoAcademiaApi.Data;
using ProjetoAcademiaApi.Services;

namespace ProjetoAcademiaApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(ContextoBanco contexto, TokenService tokens) : ControllerBase
    {
        public class LoginRequest
        {
            public string? Login { get; set; }
            public string? Senha { get; set; }
        }

        public class RecuperarSenhaRequest
        {
            public string? Login { get; set; }
            public string? Codigo { get; set; }
            public string? NovaSenha { get; set; }
        }

        [AllowAnonymous]
        [EnableRateLimiting("login")]
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrWhiteSpace(request.Senha))
                return BadRequest(new { mensagem = "Preencha usuário e senha." });

            Models.Usuario? usuario;
            try
            {
                usuario = contexto.Usuarios.FirstOrDefault(u => u.Login == request.Login);
            }
            catch (Exception)
            {
                return StatusCode(500, new { mensagem = "Erro ao acessar o banco de dados. Confira se o BANCO_PIM.sql foi executado." });
            }

            if (usuario == null || !SenhaHash.Verificar(request.Senha, usuario.Senha ?? ""))
                return Unauthorized(new { mensagem = "Usuário ou senha inválidos." });

            if (usuario.Bloqueado)
                return StatusCode(403, new { mensagem = "Acesso bloqueado. Procure o administrador master." });

            if (!SenhaHash.EstaProtegida(usuario.Senha))
            {
                usuario.Senha = SenhaHash.Gerar(request.Senha);
                contexto.SaveChanges();
            }

            var (token, expiraEm) = tokens.Gerar(usuario);
            return Ok(new { tipo = usuario.Perfil ?? "admin", login = usuario.Login, token, expiraEm });
        }

        [AllowAnonymous]
        [EnableRateLimiting("recuperacao")]
        [HttpPost("recuperar-senha")]
        public IActionResult RecuperarSenha([FromBody] RecuperarSenhaRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrWhiteSpace(request.Codigo) || string.IsNullOrWhiteSpace(request.NovaSenha))
                return BadRequest(new { mensagem = "Preencha todos os campos." });

            var erroSenha = PoliticaSenha.Validar(request.NovaSenha);
            if (erroSenha != null)
                return BadRequest(new { mensagem = erroSenha });

            var codigo = contexto.Configuracoes.Find("codigo_seguranca");
            var usuario = contexto.Usuarios.FirstOrDefault(u => u.Login == request.Login);

            if (codigo == null || usuario == null || usuario.Perfil == "master" || !SenhaHash.Verificar(request.Codigo, codigo.Valor))
                return BadRequest(new { mensagem = "Usuário ou código de segurança inválidos." });

            usuario.Senha = SenhaHash.Gerar(request.NovaSenha);
            contexto.SaveChanges();

            return Ok(new { mensagem = "Senha alterada com sucesso." });
        }

        [Authorize]
        [HttpGet("eu")]
        public IActionResult Eu() => Ok(new { login = User.Identity?.Name, perfil = User.IsInRole("master") ? "master" : "admin" });
    }
}
