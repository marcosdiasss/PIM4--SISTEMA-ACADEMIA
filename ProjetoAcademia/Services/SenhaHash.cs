using System.Security.Cryptography;
using System.Text;

namespace ProjetoAcademiaApi.Services
{
    public static class SenhaHash
    {
        private const string Prefixo = "v1";
        private const int TamanhoSal = 16, TamanhoHash = 32, Iteracoes = 100_000;

        public static bool EstaProtegida(string? armazenado) => armazenado?.StartsWith(Prefixo + ".") == true;

        public static string Gerar(string senha)
        {
            var sal = RandomNumberGenerator.GetBytes(TamanhoSal);
            var hash = Rfc2898DeriveBytes.Pbkdf2(senha, sal, Iteracoes, HashAlgorithmName.SHA256, TamanhoHash);
            return $"{Prefixo}.{Iteracoes}.{Convert.ToBase64String(sal)}.{Convert.ToBase64String(hash)}";
        }

        public static bool Verificar(string senha, string armazenado)
        {
            if (!EstaProtegida(armazenado))
                return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(senha), Encoding.UTF8.GetBytes(armazenado));

            var partes = armazenado.Split('.');
            if (partes.Length != 4 || !int.TryParse(partes[1], out var iteracoes)) return false;
            var sal = Convert.FromBase64String(partes[2]);
            var esperado = Convert.FromBase64String(partes[3]);
            var hash = Rfc2898DeriveBytes.Pbkdf2(senha, sal, iteracoes, HashAlgorithmName.SHA256, esperado.Length);
            return CryptographicOperations.FixedTimeEquals(hash, esperado);
        }
    }
}
