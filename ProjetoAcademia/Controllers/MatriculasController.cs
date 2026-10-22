using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoAcademiaApi.Data;
using ProjetoAcademiaApi.DTOs;
using ProjetoAcademiaApi.Models;
using ProjetoAcademiaApi.Services;

namespace ProjetoAcademiaApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MatriculasController : ControllerBase
    {
        private readonly ContextoBanco _contexto;
        private readonly GerenciadorAlunos _gerenciador;

        public MatriculasController(ContextoBanco contexto, GerenciadorAlunos gerenciador)
        {
            _contexto = contexto;
            _gerenciador = gerenciador;
        }

        [HttpGet]
        public IActionResult Listar()
        {
            var matriculas = _contexto.Matriculas
                .AsNoTracking()
                .Include(matricula => matricula.Aluno)
                .Include(matricula => matricula.Plano)
                .Select(matricula => new
                {
                    id = matricula.Id,
                    idAluno = matricula.IdAluno,
                    nome = matricula.Aluno != null ? matricula.Aluno.Nome : "",
                    cpf = matricula.Aluno != null ? matricula.Aluno.Cpf : "",
                    telefone = matricula.Aluno != null ? matricula.Aluno.Telefone : "",
                    dataNascimento = matricula.Aluno != null ? matricula.Aluno.DataNascimento : default,
                    idPlano = matricula.IdPlano,
                    plano = matricula.Plano != null ? matricula.Plano.Nome : "",
                    pagamento = _contexto.Pagamentos
                        .Where(pagamento => pagamento.IdMatricula == matricula.Id)
                        .Select(pagamento => pagamento.FormaPagamento)
                        .FirstOrDefault(),
                    status = matricula.Status,
                    dataInicio = matricula.DataInicio,
                    dataFim = matricula.DataFim
                })
                .ToList();

            return Ok(matriculas);
        }

        [HttpPost("cadastrar")]
        public IActionResult Cadastrar([FromBody] AlunoDTO dados)
        {
            if (dados == null)
                return BadRequest(new { mensagem = "Dados da matrícula não foram enviados." });

            dados.Nome = dados.Nome?.Trim() ?? "";
            dados.Cpf = dados.Cpf?.Replace(".", "").Replace("-", "").Trim() ?? "";
            dados.Telefone = string.IsNullOrWhiteSpace(dados.Telefone)
                ? null
                : dados.Telefone.Replace("(", "").Replace(")", "").Replace("-", "").Replace(" ", "").Trim();
            dados.Email = string.IsNullOrWhiteSpace(dados.Email) ? null : dados.Email.Trim();
            dados.FormaPagamento = dados.FormaPagamento?.Trim() ?? "";

            var erro = _gerenciador.Validar(dados);
            if (erro != null)
                return BadRequest(new { mensagem = erro });

            var planoEscolhido = _contexto.Planos.FirstOrDefault(plano => plano.Id == dados.IdPlano);
            if (planoEscolhido == null)
                return BadRequest(new { mensagem = "Plano não encontrado no banco de dados." });

            var cpfJaCadastrado = _contexto.Alunos.Any(a => a.Cpf == dados.Cpf);
            if (cpfJaCadastrado)
                return BadRequest(new { mensagem = "Já existe um aluno cadastrado com este CPF." });

            using var transacao = _contexto.Database.BeginTransaction();

            try
            {
                var aluno = new Aluno
                {
                    Id = GerarProximoIdAluno(),
                    Nome = dados.Nome,
                    Cpf = dados.Cpf,
                    Telefone = dados.Telefone,
                    Email = dados.Email,
                    DataNascimento = dados.DataNascimento
                };

                _contexto.Alunos.Add(aluno);
                _contexto.SaveChanges();

                var matricula = new Matricula
                {
                    Id = GerarProximoIdMatricula(),
                    IdAluno = aluno.Id,
                    IdPlano = dados.IdPlano,
                    Status = "Ativa",
                    DataInicio = dados.DataInicio,
                    DataFim = dados.DataInicio.AddMonths(planoEscolhido.DuracaoMeses)
                };

                _contexto.Matriculas.Add(matricula);
                _contexto.SaveChanges();

                var pagamento = new Pagamento
                {
                    Id = GerarProximoIdPagamento(),
                    FormaPagamento = dados.FormaPagamento,
                    IdMatricula = matricula.Id,
                    IdUsuario = GerarIdUsuarioPadrao()
                };

                _contexto.Pagamentos.Add(pagamento);
                _contexto.SaveChanges();

                transacao.Commit();

                return Ok(new
                {
                    mensagem = "Matrícula cadastrada com sucesso!",
                    idAluno = aluno.Id,
                    idMatricula = matricula.Id,
                    idPagamento = pagamento.Id
                });
            }
            catch (Exception ex)
            {
                transacao.Rollback();

                return BadRequest(new
                {
                    mensagem = "Erro ao cadastrar matrícula.",
                    detalhe = ex.InnerException?.Message ?? ex.Message
                });
            }
        }

        private int GerarProximoIdAluno()
        {
            return _contexto.Alunos.Any() ? _contexto.Alunos.Max(aluno => aluno.Id) + 1 : 1;
        }

        private int GerarProximoIdMatricula()
        {
            return _contexto.Matriculas.Any() ? _contexto.Matriculas.Max(matricula => matricula.Id) + 1 : 1;
        }

        private int GerarProximoIdPagamento()
        {
            return _contexto.Pagamentos.Any() ? _contexto.Pagamentos.Max(pagamento => pagamento.Id) + 1 : 1;
        }

        private int GerarIdUsuarioPadrao()
        {
            var usuario = _contexto.Usuarios.FirstOrDefault();
            return usuario?.Id ?? 1;
        }
    }
}
