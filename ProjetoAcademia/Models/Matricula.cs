using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoAcademiaApi.Models
{
    [Table("Matricula")]
    public class Matricula
    {
        [Key]
        [Column("id_matricula")]
        public int Id { get; set; }

        [Column("status")]
        public string? Status { get; set; }

        [Column("data_inicio")]
        public DateOnly DataInicio { get; set; }

        [Column("data_fim")]
        public DateOnly? DataFim { get; set; }

        [Column("id_aluno")]
        public int IdAluno { get; set; }

        [Column("id_plano")]
        public int IdPlano { get; set; }

        [ForeignKey("IdAluno")]
        public Aluno? Aluno { get; set; }

        [ForeignKey("IdPlano")]
        public Plano? Plano { get; set; }

        public Pagamento? Pagamento { get; set; }
    }
}
