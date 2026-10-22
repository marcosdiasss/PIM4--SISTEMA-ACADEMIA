using ProjetoAcademiaApi.DTOs;

namespace ProjetoAcademiaApi.Services
{
    public class GerenciadorAlunos
    {
        private static readonly HashSet<string> FormasPagamentoValidas =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "Crédito", "Débito", "PIX", "Dinheiro"
            };

        public string? Validar(AlunoDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                return "O nome é obrigatório.";

            var nomeTrim = dto.Nome.Trim();
            if (nomeTrim.Length < 3 || nomeTrim.Length > 100)
                return "O nome deve ter entre 3 e 100 caracteres.";

            if (!nomeTrim.All(c => char.IsLetter(c) || char.IsWhiteSpace(c)))
                return "O nome deve conter apenas letras e espaços.";

            if (string.IsNullOrWhiteSpace(dto.Cpf))
                return "O CPF é obrigatório.";

            var cpfNums = dto.Cpf.Replace(".", "").Replace("-", "").Trim();
            if (!ValidarCpf(cpfNums))
                return "CPF inválido. Verifique os dígitos informados.";

            if (!string.IsNullOrWhiteSpace(dto.Telefone))
            {
                var telNums = dto.Telefone.Replace("(", "").Replace(")", "").Replace("-", "").Replace(" ", "").Trim();
                if (telNums.Length < 10 || telNums.Length > 11 || !telNums.All(char.IsDigit))
                    return "Telefone inválido. Use o formato (XX) XXXXX-XXXX.";
            }

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var email = dto.Email.Trim();
                if (email.Length > 100)
                    return "O e-mail deve ter no máximo 100 caracteres.";
                if (!email.Contains('@') || !email.Contains('.'))
                    return "E-mail inválido.";
            }

            if (dto.DataNascimento == DateOnly.MinValue)
                return "Data de nascimento inválida. Use o formato AAAA-MM-DD.";

            if (dto.DataNascimento > DateOnly.FromDateTime(DateTime.Today))
                return "Data de nascimento não pode ser no futuro.";

            if (dto.DataNascimento.Year < 1900)
                return "Data de nascimento inválida. O ano mínimo é 1900.";

            var idade = DateTime.Today.Year - dto.DataNascimento.Year;
            if (dto.DataNascimento.ToDateTime(TimeOnly.MinValue) > DateTime.Today.AddYears(-idade)) idade--;
            if (idade < 5)
                return "O aluno deve ter pelo menos 5 anos de idade.";

            if (dto.DataInicio == DateOnly.MinValue)
                return "Informe a data de início da matrícula.";
            if (dto.DataInicio.Year < 2000)
                return "Data de início inválida.";
            if (dto.DataInicio > DateOnly.FromDateTime(DateTime.Today.AddYears(1)))
                return "A data de início não pode passar de 1 ano no futuro.";

            if (dto.IdPlano <= 0)
                return "Selecione um plano válido.";

            if (string.IsNullOrWhiteSpace(dto.FormaPagamento))
                return "Selecione a forma de pagamento.";

            if (!FormasPagamentoValidas.Contains(dto.FormaPagamento.Trim()))
                return $"Forma de pagamento inválida. Opções: {string.Join(", ", FormasPagamentoValidas)}.";

            return null;
        }

        private static bool ValidarCpf(string cpf)
        {
            if (cpf.Length != 11 || !cpf.All(char.IsDigit)) return false;
            if (cpf.Distinct().Count() == 1) return false;

            int[] mult1 = { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] mult2 = { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };

            var soma = 0;
            for (var i = 0; i < 9; i++)
                soma += (cpf[i] - '0') * mult1[i];

            var resto = soma % 11;
            var dig1 = resto < 2 ? 0 : 11 - resto;

            soma = 0;
            for (var i = 0; i < 10; i++)
                soma += (cpf[i] - '0') * mult2[i];

            resto = soma % 11;
            var dig2 = resto < 2 ? 0 : 11 - resto;

            return cpf[9] - '0' == dig1 && cpf[10] - '0' == dig2;
        }
    }
}
