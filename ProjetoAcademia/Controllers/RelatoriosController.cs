using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using ProjetoAcademiaApi.Data;

namespace ProjetoAcademiaApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api")]
    public class RelatoriosController(ContextoBanco contexto) : ControllerBase
    {
        public class PlanoTotal { public string Plano { get; set; } = ""; public int TotalMatriculas { get; set; } }
        public class MesTotal { public int Ano { get; set; } public int Mes { get; set; } public int Total { get; set; } }
        public class FormaTotal { public string FormaPagamento { get; set; } = ""; public int Quantidade { get; set; } }

        [HttpGet("relatorios/planos")]
        public IActionResult PorPlano([FromQuery] DateOnly? inicio, [FromQuery] DateOnly? fim) =>
            Ok(contexto.Database.SqlQueryRaw<PlanoTotal>("EXEC sp_RelatorioPorPlano @Inicio, @Fim",
                new SqlParameter("@Inicio", (object?)inicio?.ToDateTime(TimeOnly.MinValue) ?? DBNull.Value),
                new SqlParameter("@Fim", (object?)fim?.ToDateTime(TimeOnly.MinValue) ?? DBNull.Value)).ToList());

        [HttpGet("relatorios/mensal")]
        public IActionResult PorMes([FromQuery] int? ano) =>
            Ok(contexto.Database.SqlQueryRaw<MesTotal>("EXEC sp_MatriculasPorMes @Ano",
                new SqlParameter("@Ano", (object?)ano ?? DBNull.Value)).ToList());

        [HttpGet("relatorios/pagamentos")]
        public IActionResult Pagamentos() =>
            Ok(contexto.Database.SqlQueryRaw<FormaTotal>("EXEC sp_ResumoPagamentos").ToList());

        [Authorize(Roles = "master")]
        [HttpPost("matriculas/{id:int}/cancelar")]
        public IActionResult Cancelar(int id)
        {
            try
            {
                contexto.Database.ExecuteSqlRaw("EXEC sp_CancelarMatricula @IdMatricula", new SqlParameter("@IdMatricula", id));
                return Ok(new { mensagem = "Matrícula cancelada." });
            }
            catch (SqlException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }
    }
}
