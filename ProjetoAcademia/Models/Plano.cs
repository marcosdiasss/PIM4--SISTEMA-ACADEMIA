using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoAcademiaApi.Models
{
    [Table("Plano")]
    public class Plano
    {
        [Key]
        [Column("id_plano")]
        public int Id { get; set; }

        [Column("nome")]
        public string? Nome { get; set; }

        [Column("duracao_meses")]
        public int DuracaoMeses { get; set; }
    }
}