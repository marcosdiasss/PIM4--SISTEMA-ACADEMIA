IF DB_ID('PIM') IS NOT NULL
BEGIN
    ALTER DATABASE PIM SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE PIM;
END
GO

IF DB_ID('PIM') IS NULL
    CREATE DATABASE PIM;
GO

USE PIM;
GO

IF OBJECT_ID('Usuario', 'U') IS NULL
CREATE TABLE Usuario (
    id_Usuario INT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL CONSTRAINT DF_Usuario_perfil DEFAULT 'admin'
);

IF OBJECT_ID('Plano', 'U') IS NULL
CREATE TABLE Plano (
    id_plano INT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    duracao_meses INT NOT NULL
);

IF OBJECT_ID('Aluno', 'U') IS NULL
CREATE TABLE Aluno (
    id_aluno INT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(11) NULL,
    email VARCHAR(100) NULL,
    data_nascimento DATE NOT NULL
);

IF OBJECT_ID('Matricula', 'U') IS NULL
CREATE TABLE Matricula (
    id_matricula INT PRIMARY KEY,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_Matricula_status DEFAULT 'Ativa',
    data_inicio DATE NOT NULL CONSTRAINT DF_Matricula_inicio DEFAULT CAST(GETDATE() AS DATE),
    data_fim DATE NULL,
    id_aluno INT NOT NULL,
    id_plano INT NOT NULL,
    CONSTRAINT FK_Matricula_Aluno FOREIGN KEY (id_aluno) REFERENCES Aluno(id_aluno),
    CONSTRAINT FK_Matricula_Plano FOREIGN KEY (id_plano) REFERENCES Plano(id_plano)
);

IF OBJECT_ID('Pagamento', 'U') IS NULL
CREATE TABLE Pagamento (
    id_pagamento INT PRIMARY KEY,
    forma_pagamento VARCHAR(50) NOT NULL,
    id_matricula INT NOT NULL,
    id_Usuario INT NOT NULL,
    CONSTRAINT FK_Pagamento_Matricula FOREIGN KEY (id_matricula) REFERENCES Matricula(id_matricula),
    CONSTRAINT FK_Pagamento_Usuario FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario)
);

IF OBJECT_ID('RecuperacaoSenha', 'U') IS NULL
CREATE TABLE RecuperacaoSenha (
    id_recuperacao INT IDENTITY PRIMARY KEY,
    id_Usuario INT NOT NULL,
    token VARCHAR(100) NOT NULL,
    utilizado BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_RecuperacaoSenha_Usuario FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario)
);

IF OBJECT_ID('Auditoria', 'U') IS NULL
CREATE TABLE Auditoria (
    id_auditoria INT IDENTITY PRIMARY KEY,
    tabela VARCHAR(50) NOT NULL,
    acao VARCHAR(10) NOT NULL,
    registro_id INT,
    data_hora DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    usuario_bd SYSNAME NOT NULL DEFAULT SUSER_SNAME()
);
GO

IF COL_LENGTH('Usuario', 'perfil') IS NULL
    ALTER TABLE Usuario ADD perfil VARCHAR(20) NOT NULL CONSTRAINT DF_Usuario_perfil DEFAULT 'admin';

IF COL_LENGTH('Matricula', 'data_inicio') IS NULL
    ALTER TABLE Matricula ADD data_inicio DATE NOT NULL CONSTRAINT DF_Matricula_inicio DEFAULT CAST(GETDATE() AS DATE);

IF COL_LENGTH('Matricula', 'data_fim') IS NULL
    ALTER TABLE Matricula ADD data_fim DATE NULL;

ALTER TABLE Aluno ALTER COLUMN telefone VARCHAR(11) NULL;
ALTER TABLE Aluno ALTER COLUMN email VARCHAR(100) NULL;
GO

UPDATE m SET data_fim = DATEADD(MONTH, p.duracao_meses, m.data_inicio)
FROM Matricula m
JOIN Plano p ON p.id_plano = m.id_plano
WHERE m.data_fim IS NULL;

UPDATE Usuario SET perfil = 'master' WHERE login = 'master';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Matricula_Aluno' AND object_id = OBJECT_ID('Matricula'))
    CREATE INDEX IX_Matricula_Aluno ON Matricula (id_aluno);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Matricula_Plano' AND object_id = OBJECT_ID('Matricula'))
    CREATE INDEX IX_Matricula_Plano ON Matricula (id_plano, status);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Pagamento_Matricula' AND object_id = OBJECT_ID('Pagamento'))
    CREATE INDEX IX_Pagamento_Matricula ON Pagamento (id_matricula);
GO

IF NOT EXISTS (SELECT 1 FROM Usuario WHERE login = 'admin')
    INSERT INTO Usuario (id_Usuario, login, senha, perfil)
    VALUES (1, 'admin', 'v1.100000.JzUMs4h1ttUeid5TNLVX/w==.Tt8fDDaPPijvlQFMrA7iYAVzxm2WEAj0JSADTpI6iiY=', 'admin');

IF NOT EXISTS (SELECT 1 FROM Usuario WHERE login = 'master')
    INSERT INTO Usuario (id_Usuario, login, senha, perfil)
    VALUES (2, 'master', 'v1.100000.waVE77e235rxYab+IpK9Uw==.VQFplk337YoFETyPzvzYld4lk4YBSwBsUlnow1dgEGE=', 'master');

INSERT INTO Plano (id_plano, nome, duracao_meses)
SELECT v.id_plano, v.nome, v.duracao_meses
FROM (VALUES
    (1, 'Plano Mensal', 1),
    (2, 'Plano Trimestral', 3),
    (3, 'Plano Semestral', 6),
    (4, 'Plano Anual', 12)
) AS v (id_plano, nome, duracao_meses)
WHERE NOT EXISTS (SELECT 1 FROM Plano p WHERE p.id_plano = v.id_plano);

IF NOT EXISTS (SELECT 1 FROM Aluno)
BEGIN
    INSERT INTO Aluno (id_aluno, nome, cpf, telefone, email, data_nascimento)
    VALUES (1, 'Aluno Exemplo', '52998224725', '11999999999', 'aluno.exemplo@email.com', '1995-05-20');

    INSERT INTO Matricula (id_matricula, status, data_inicio, data_fim, id_aluno, id_plano)
    VALUES (1, 'Ativa', '2026-10-01', '2027-01-01', 1, 2);

    INSERT INTO Pagamento (id_pagamento, forma_pagamento, id_matricula, id_Usuario)
    VALUES (1, 'PIX', 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM RecuperacaoSenha)
    INSERT INTO RecuperacaoSenha (id_Usuario, token, utilizado) VALUES (1, '1234', 0);
GO

CREATE OR ALTER VIEW vw_MatriculasDetalhadas AS
SELECT m.id_matricula, m.status, m.data_inicio, m.data_fim, a.id_aluno, a.nome, a.cpf,
       p.nome AS plano, p.duracao_meses, pg.forma_pagamento
FROM Matricula m
JOIN Aluno a ON a.id_aluno = m.id_aluno
JOIN Plano p ON p.id_plano = m.id_plano
LEFT JOIN Pagamento pg ON pg.id_matricula = m.id_matricula;
GO

CREATE OR ALTER PROCEDURE sp_RelatorioPorPlano @Inicio DATE = NULL, @Fim DATE = NULL AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.nome AS Plano, COUNT(m.id_matricula) AS TotalMatriculas
    FROM Plano p
    LEFT JOIN Matricula m ON m.id_plano = p.id_plano AND m.status = 'Ativa'
         AND (@Inicio IS NULL OR m.data_inicio >= @Inicio)
         AND (@Fim IS NULL OR m.data_inicio <= @Fim)
    GROUP BY p.nome
    ORDER BY TotalMatriculas DESC, p.nome;
END
GO

CREATE OR ALTER PROCEDURE sp_MatriculasPorMes @Ano INT = NULL AS
BEGIN
    SET NOCOUNT ON;
    SELECT YEAR(data_inicio) AS Ano, MONTH(data_inicio) AS Mes, COUNT(*) AS Total
    FROM Matricula
    WHERE @Ano IS NULL OR YEAR(data_inicio) = @Ano
    GROUP BY YEAR(data_inicio), MONTH(data_inicio)
    ORDER BY Ano, Mes;
END
GO

CREATE OR ALTER PROCEDURE sp_ResumoPagamentos AS
BEGIN
    SET NOCOUNT ON;
    SELECT forma_pagamento AS FormaPagamento, COUNT(*) AS Quantidade
    FROM Pagamento
    GROUP BY forma_pagamento
    ORDER BY Quantidade DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_CancelarMatricula @IdMatricula INT AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM Matricula WHERE id_matricula = @IdMatricula)
            THROW 50002, 'Matrícula não encontrada.', 1;
        UPDATE Matricula SET status = 'Cancelada' WHERE id_matricula = @IdMatricula;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER TRIGGER trg_Matricula_Auditoria ON Matricula AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Auditoria (tabela, acao, registro_id)
    SELECT 'Matricula',
           CASE WHEN d.id_matricula IS NULL THEN 'INSERT'
                WHEN i.id_matricula IS NULL THEN 'DELETE'
                ELSE 'UPDATE' END,
           COALESCE(i.id_matricula, d.id_matricula)
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.id_matricula = d.id_matricula;
END
GO

CREATE OR ALTER TRIGGER trg_Matricula_UmaAtiva ON Matricula AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Matricula m
               JOIN inserted i ON m.id_aluno = i.id_aluno
               WHERE m.status = 'Ativa'
               GROUP BY m.id_aluno
               HAVING COUNT(*) > 1)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50001, 'O aluno já possui uma matrícula ativa.', 1;
    END
END
GO
