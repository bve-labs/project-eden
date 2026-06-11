IF OBJECT_ID(N'dbo.swarm_audit_log', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.swarm_audit_log (
        log_id BIGINT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_swarm_audit_log PRIMARY KEY,
        run_id NVARCHAR(64) NOT NULL,
        agent_id NVARCHAR(128) NOT NULL,
        step INT NOT NULL,
        loss FLOAT NOT NULL,
        val_bpb FLOAT NOT NULL,
        step_time FLOAT NOT NULL,
        hyperparameters NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(32) NOT NULL
            CONSTRAINT DF_swarm_audit_log_status DEFAULT N'RUNNING',
        created_at DATETIME2(7) NOT NULL
            CONSTRAINT DF_swarm_audit_log_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_swarm_audit_log_hyperparameters_json
            CHECK (ISJSON(hyperparameters) = 1),
        CONSTRAINT CK_swarm_audit_log_status
            CHECK (status IN (N'RUNNING', N'SUCCESS', N'KILLED_EARLY', N'CRASHED'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.swarm_audit_log', N'U')
      AND name = N'IX_swarm_audit_log_run_created_step'
)
BEGIN
    CREATE INDEX IX_swarm_audit_log_run_created_step
    ON dbo.swarm_audit_log (run_id, created_at, step)
    INCLUDE (agent_id, loss, val_bpb, step_time, status);
END;
GO

CREATE OR ALTER VIEW dbo.vw_swarm_run_summaries AS
WITH run_aggregates AS (
    SELECT
        run_id,
        MIN(loss) AS final_loss,
        MIN(val_bpb) AS final_val_bpb,
        MAX(step) AS max_iters,
        MAX(created_at) AS last_created_at
    FROM dbo.swarm_audit_log
    GROUP BY run_id
),
latest_rows AS (
    SELECT
        run_id,
        agent_id,
        hyperparameters,
        status,
        ROW_NUMBER() OVER (
            PARTITION BY run_id
            ORDER BY created_at DESC, log_id DESC
        ) AS row_num
    FROM dbo.swarm_audit_log
)
SELECT
    a.run_id,
    l.agent_id,
    a.final_loss,
    a.final_val_bpb,
    a.max_iters,
    l.hyperparameters,
    l.status,
    a.last_created_at
FROM run_aggregates AS a
INNER JOIN latest_rows AS l
    ON l.run_id = a.run_id
   AND l.row_num = 1;
GO
