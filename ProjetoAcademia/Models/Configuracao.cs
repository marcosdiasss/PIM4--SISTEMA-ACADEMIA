using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoAcademiaApi.Models
{
    [Table("Configuracao")]
    public class Configuracao
    {
        [Key]
        [Column("chave")]
        public string Chave { get; set; } = "";

        [Column("valor")]
        public string Valor { get; set; } = "";
    }
}
