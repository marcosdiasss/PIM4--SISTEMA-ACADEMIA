using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoAcademiaApi.Data;
using ProjetoAcademiaApi.Models;

namespace ProjetoAcademiaApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AlunosController : ControllerBase
    {
        private readonly ContextoBanco _contexto;

        public AlunosController(ContextoBanco contexto)
        {
            _contexto = contexto;
        }

        [HttpGet]
        public IActionResult Listar()
        {
            var alunos = _contexto.Alunos.ToList();
            return Ok(alunos);
        }

        [HttpPost]
        public IActionResult Cadastrar([FromBody] Aluno aluno)
        {
            if (aluno == null)
                return BadRequest(new { mensagem = "Dados do aluno não foram enviados." });

            if (string.IsNullOrWhiteSpace(aluno.Nome))
                return BadRequest(new { mensagem = "O nome é obrigatório." });

            if (string.IsNullOrWhiteSpace(aluno.Cpf))
                return BadRequest(new { mensagem = "O CPF é obrigatório." });

            var cpfLimpo = aluno.Cpf.Replace(".", "").Replace("-", "").Trim();
            aluno.Cpf = cpfLimpo;

            if (_contexto.Alunos.Any(a => a.Cpf == cpfLimpo))
                return BadRequest(new { mensagem = "Já existe um aluno cadastrado com este CPF." });

            aluno.Id = _contexto.Alunos.Any() ? _contexto.Alunos.Max(a => a.Id) + 1 : 1;

            _contexto.Alunos.Add(aluno);
            _contexto.SaveChanges();

            return Ok(aluno);
        }

        [Authorize(Roles = "master")]
        [HttpDelete("{id}")]
        public IActionResult Excluir(int id)
        {
            var aluno = _contexto.Alunos.Find(id);
            if (aluno == null) return NotFound();

            _contexto.Alunos.Remove(aluno);
            _contexto.SaveChanges();

            return NoContent();
        }

        [HttpPut("{id}")]
        public IActionResult Atualizar(int id, [FromBody] Aluno aluno)
        {
            var existente = _contexto.Alunos.Find(id);
            if (existente == null) return NotFound();

            if (string.IsNullOrWhiteSpace(aluno.Nome))
                return BadRequest(new { mensagem = "O nome é obrigatório." });

            var telefone = new string((aluno.Telefone ?? "").Where(char.IsDigit).ToArray());
            if (telefone.Length != 0 && (telefone.Length < 10 || telefone.Length > 11))
                return BadRequest(new { mensagem = "Telefone inválido. Informe o DDD e o número." });

            if (!string.IsNullOrWhiteSpace(aluno.Cpf))
            {
                var cpfLimpo = new string(aluno.Cpf.Where(char.IsDigit).ToArray());
                if (cpfLimpo.Length != 11)
                    return BadRequest(new { mensagem = "O CPF deve ter 11 dígitos." });
                if (_contexto.Alunos.Any(a => a.Cpf == cpfLimpo && a.Id != id))
                    return BadRequest(new { mensagem = "Já existe outro aluno cadastrado com este CPF." });
                existente.Cpf = cpfLimpo;
            }

            existente.Nome = aluno.Nome.Trim();
            existente.Telefone = telefone.Length == 0 ? null : telefone;
            if (!string.IsNullOrWhiteSpace(aluno.Email)) existente.Email = aluno.Email.Trim();
            existente.DataNascimento = aluno.DataNascimento;

            _contexto.SaveChanges();

            return Ok(existente);
        }
    }
}
