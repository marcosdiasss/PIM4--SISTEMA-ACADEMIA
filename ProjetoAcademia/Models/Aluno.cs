using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoAcademiaApi.Models
{
    [Table("Aluno")]
    public class Aluno
    {
        [Key]
        [Column("id_aluno")]
        public int Id { get; set; }

        [Column("nome")]
        public string? Nome { get; set; }

        [Column("cpf")]
        public string? Cpf { get; set; }

        [Column("telefone")]
        public string? Telefone { get; set; }

        [Column("email")]
        public string? Email { get; set; }

        [Column("data_nascimento")]
        public DateOnly DataNascimento { get; set; }
    }
}
