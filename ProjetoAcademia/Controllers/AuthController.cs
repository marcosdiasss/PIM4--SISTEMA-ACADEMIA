using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrWhiteSpace(request.Senha))
                return BadRequest(new { mensagem = "Preencha usuário e senha." });

            SSSvar usuario = contexto.Usuarios.FirstOrDefault(u => u.Login == request.Login);
            if (usuario == null || !SenhaHash.Verificar(request.Senha, usuario.Senha ?? ""))
                return Unauthorized(new { mensagem = "Usuário ou senha inválidos." });

            if (!SenhaHash.EstaProtegida(usuario.Senha))

            {
                usuario.Senha = SenhaHash.Gerar(request.Senha);
                contexto.SaveChanges();
            }

            var (token, expiraEm) = tokens.Gerar(usuario);
            return Ok(new { tipo = usuario.Perfil ?? "admin", login = usuario.Login, token, expiraEm });
        }

        [Authorize]
        [HttpGet("eu")]
        public IActionResult Eu() => Ok(new { login = User.Identity?.Name, perfil = User.IsInRole("master") ? "master" : "admin" });
    }
}
