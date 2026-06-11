# 1. AT THE START OF train_gpt.py (Inside train())
# Load the JSON config the Swarm generated for this run
import json
with open("swarm_config.json", "r") as f:
    swarm_config = f.read()

# Insert the initial record into swarm_experiments
with pyodbc.connect(AZURE_SQL_CONN_STR) as conn:
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO swarm_experiments (run_id, agent_id, hyperparameters, max_iters, status)
            VALUES (?, ?, ?, ?, 'RUNNING')
        """, run_id, "Swarm_Alpha_Biologist", swarm_config, max_iters)
        conn.commit()


# 2. AT THE END OF THE SCRIPT (Or right before sys.exit(1) on a kill-switch)
# Update the record with the final verdict
final_status = "SUCCESS" if loss_value <= target_baseline else "KILLED_EARLY"

with pyodbc.connect(AZURE_SQL_CONN_STR) as conn:
    with conn.cursor() as cursor:
        cursor.execute("""
            UPDATE swarm_experiments 
            SET final_loss = ?, final_val_bpb = ?, status = ?, duration_seconds = ?
            WHERE run_id = ?
        """, loss_value, val_bpb, final_status, total_duration, run_id)
        conn.commit()