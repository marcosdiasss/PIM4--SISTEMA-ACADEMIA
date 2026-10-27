using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjetoAcademiaApi.Data;
using ProjetoAcademiaApi.Services;

namespace ProjetoAcademiaApi.Controllers
{
    [Authorize(Roles = "master")]
    [ApiController]
    [Route("api/[controller]")]
    public class MasterController(ContextoBanco contexto) : ControllerBase
    {
        public class AlterarCodigoRequest
        {
            public string? CodigoAtual { get; set; }
            public string? NovoCodigo { get; set; }
        }

        [HttpGet("admin")]
        public IActionResult StatusAdmin()
        {
            var admins = contexto.Usuarios.Where(u => u.Perfil == "admin").ToList();
            return Ok(new { bloqueado = admins.Count > 0 && admins.All(a => a.Bloqueado) });
        }

        [HttpPost("admin/bloqueio")]
        public IActionResult AlternarBloqueioAdmin()
        {
            var admins = contexto.Usuarios.Where(u => u.Perfil == "admin").ToList();
            var novoEstado = !(admins.Count > 0 && admins.All(a => a.Bloqueado));

            admins.ForEach(a => a.Bloqueado = novoEstado);
            contexto.SaveChanges();

            return Ok(new { bloqueado = novoEstado });
        }

        [HttpPost("codigo")]
        public IActionResult AlterarCodigo([FromBody] AlterarCodigoRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CodigoAtual) || string.IsNullOrWhiteSpace(request.NovoCodigo))
                return BadRequest(new { mensagem = "Preencha o código atual e o novo código." });

            var codigo = contexto.Configuracoes.Find("codigo_seguranca");
            if (codigo == null || !SenhaHash.Verificar(request.CodigoAtual, codigo.Valor))
                return BadRequest(new { mensagem = "O código atual está incorreto." });

            var erro = PoliticaSenha.Validar(request.NovoCodigo);
            if (erro != null)
                return BadRequest(new { mensagem = erro.Replace("A senha", "O código") });

            codigo.Valor = SenhaHash.Gerar(request.NovoCodigo);
            contexto.SaveChanges();

            return Ok(new { mensagem = "Código de segurança alterado com sucesso." });
        }
    }
}
