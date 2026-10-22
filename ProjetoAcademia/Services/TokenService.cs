using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using ProjetoAcademiaApi.Models;

namespace ProjetoAcademiaApi.Services
{
    public class TokenService(IConfiguration config)
    {
        public (string Token, DateTime ExpiraEm) Gerar(Usuario usuario)
        {
            var expira = DateTime.UtcNow.AddMinutes(config.GetValue("Jwt:ExpiraMinutos", 120));
            var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
            var descritor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                    new Claim(ClaimTypes.Name, usuario.Login ?? ""),
                    new Claim(ClaimTypes.Role, usuario.Perfil ?? "admin")
                }),
                Issuer = config["Jwt:Issuer"],
                Audience = config["Jwt:Audience"],
                Expires = expira,
                SigningCredentials = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256)
            };
            return (new JsonWebTokenHandler().CreateToken(descritor), expira);
        }
    }
}
