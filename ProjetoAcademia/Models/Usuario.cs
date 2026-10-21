using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoAcademiaApi.Models
{
    [Table("Usuario")]
    public class Usuario
    {
        [Key]
        [Column("id_Usuario")]
        public int Id { get; set; }

        [Column("login")]
        public string? Login { get; set; }

        [Column("senha")]
        public string? Senha { get; set; }

        [Column("perfil")]
        public string? Perfil { get; set; }
    }
}
