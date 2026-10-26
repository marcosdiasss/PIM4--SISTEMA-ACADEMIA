using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjetoAcademiaApi.Converters;
using ProjetoAcademiaApi.Data;
using ProjetoAcademiaApi.Services;

var builder = WebApplication.CreateBuilder(args);

var chaveJwt = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(chaveJwt) || chaveJwt.Length < 32)
    throw new InvalidOperationException("Configure Jwt:Key (mínimo 32 caracteres) por variável de ambiente Jwt__Key.");

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter()));
builder.Services.AddOpenApi();

builder.Services.AddDbContext<ContextoBanco>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("ConexaoBanco")));
builder.Services.AddScoped<GerenciadorAlunos>();
builder.Services.AddSingleton<TokenService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chaveJwt)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        o.Events = new JwtBearerEvents
        {
            OnTokenValidated = async contextoToken =>
            {
                var texto = contextoToken.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(texto, out var id)) return;

                var banco = contextoToken.HttpContext.RequestServices.GetRequiredService<ContextoBanco>();
                var bloqueado = await banco.Usuarios.AsNoTracking()
                    .Where(u => u.Id == id)
                    .Select(u => u.Bloqueado)
                    .FirstOrDefaultAsync();

                if (bloqueado) contextoToken.Fail("Usuário bloqueado.");
            }
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(opcoes =>
{
    opcoes.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    opcoes.AddPolicy("login", http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "local",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
    opcoes.AddPolicy("recuperacao", http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "local",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(15) }));
});

var app = builder.Build();

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        ctx.Context.Response.Headers["Pragma"] = "no-cache";
        ctx.Context.Response.Headers["Expires"] = "0";
    }
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapControllers();
app.MapGet("/api/saude", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/", () => Results.Redirect("/html/login.html"));

app.Run();
