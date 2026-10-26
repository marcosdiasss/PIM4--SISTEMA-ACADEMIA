namespace ProjetoAcademiaApi.Services
{
    public static class PoliticaSenha
    {
        public static string? Validar(string? senha)
        {
            if (string.IsNullOrEmpty(senha) || senha.Length < 8)
                return "A senha deve ter no mínimo 8 caracteres.";
            if (senha.Count(char.IsDigit) < 2)
                return "A senha deve ter no mínimo 2 números.";
            if (!senha.Any(c => !char.IsLetterOrDigit(c)))
                return "A senha deve ter no mínimo 1 caractere especial.";
            if (!senha.Any(char.IsUpper))
                return "A senha deve ter no mínimo 1 letra maiúscula.";
            if (!senha.Any(char.IsLower))
                return "A senha deve ter no mínimo 1 letra minúscula.";
            return null;
        }
    }
}
