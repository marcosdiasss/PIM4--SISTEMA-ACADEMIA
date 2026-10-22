using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoAcademiaApi.Models
{
    [Table("Pagamento")]
    public class Pagamento
    {
        [Key]
        [Column("id_pagamento")]
        public int Id { get; set; }

        [Column("forma_pagamento")]
        public string? FormaPagamento { get; set; }

        [Column("id_matricula")]
        public int IdMatricula { get; set; }

        [Column("id_Usuario")]
        public int IdUsuario { get; set; }

        [ForeignKey("IdMatricula")]
        public Matricula? Matricula { get; set; }

        [ForeignKey("IdUsuario")]
        public Usuario? Usuario { get; set; }
    }
}
