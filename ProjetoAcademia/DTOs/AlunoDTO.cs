using System.ComponentModel.DataAnnotations;

namespace ProjetoAcademiaApi.DTOs
{
    public class AlunoDTO
    {
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CPF é obrigatório.")]
        [StringLength(11, MinimumLength = 11, ErrorMessage = "O CPF deve conter exatamente 11 dígitos numéricos.")]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "O CPF deve conter apenas números (sem pontos ou traços).")]
        public string Cpf { get; set; } = string.Empty;

        [StringLength(11, MinimumLength = 10, ErrorMessage = "O telefone deve ter 10 ou 11 dígitos numéricos.")]
        [RegularExpression(@"^\d{10,11}$", ErrorMessage = "O telefone deve conter apenas números (sem formatação).")]
        public string? Telefone { get; set; }

        [EmailAddress(ErrorMessage = "E-mail inválido.")]
        [StringLength(100, ErrorMessage = "O e-mail deve ter no máximo 100 caracteres.")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "A data de nascimento é obrigatória.")]
        public DateOnly DataNascimento { get; set; }

        [Required(ErrorMessage = "Selecione um plano.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione um plano válido.")]
        public int IdPlano { get; set; }

        [Required(ErrorMessage = "A data de início da matrícula é obrigatória.")]
        public DateOnly DataInicio { get; set; }

        [Required(ErrorMessage = "Selecione a forma de pagamento.")]
        public string FormaPagamento { get; set; } = string.Empty;
    }
}
