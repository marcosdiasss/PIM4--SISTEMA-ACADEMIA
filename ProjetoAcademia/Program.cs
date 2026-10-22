using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chaveJwt)),
        ClockSkew = TimeSpan.FromMinutes(1)
    });
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        ctx.Context.Response.Headers["Pragma"] = "no-cache";
        ctx.Context.Response.Headers["Expires"] = "0";
    }
});
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapControllers();
app.MapGet("/api/saude", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/", () => Results.Redirect("/html/login.html"));

app.Run();
