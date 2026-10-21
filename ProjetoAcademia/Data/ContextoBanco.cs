using Microsoft.EntityFrameworkCore;
using ProjetoAcademiaApi.Models;

namespace ProjetoAcademiaApi.Data
{
    public class ContextoBanco : DbContext
    {
        public ContextoBanco(DbContextOptions<ContextoBanco> options)
            : base(options)
        {
        }

        public DbSet<Aluno> Alunos { get; set; } = null!;
        public DbSet<Plano> Planos { get; set; } = null!;
        public DbSet<Usuario> Usuarios { get; set; } = null!;
        public DbSet<Matricula> Matriculas { get; set; } = null!;
        public DbSet<Pagamento> Pagamentos { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Aluno>().Property(a => a.Id).ValueGeneratedNever();
            modelBuilder.Entity<Plano>().Property(p => p.Id).ValueGeneratedNever();
            modelBuilder.Entity<Matricula>().Property(m => m.Id).ValueGeneratedNever();
            modelBuilder.Entity<Pagamento>().Property(p => p.Id).ValueGeneratedNever();
            modelBuilder.Entity<Usuario>().Property(u => u.Id).ValueGeneratedNever();
        }
    }
}