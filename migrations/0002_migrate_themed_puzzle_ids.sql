-- Migration to update themed puzzle IDs from dates to numeric IDs
-- This migrates existing themed puzzle data to use the new ID system

-- Update solves table: Change themed puzzle dates to numeric IDs
UPDATE solves 
SET puzzle_id = '1' 
WHERE puzzle_id = '2025-08-10';  -- Marvelous Motown

UPDATE solves 
SET puzzle_id = '2' 
WHERE puzzle_id = '2025-08-03';  -- It was never a phase

UPDATE solves 
SET puzzle_id = '3' 
WHERE puzzle_id = '2025-07-27';  -- Disney on Ice

-- Update solve_events table: Change themed puzzle dates to numeric IDs
UPDATE solve_events 
SET puzzle_id = '1' 
WHERE puzzle_id = '2025-08-10';  -- Marvelous Motown

UPDATE solve_events 
SET puzzle_id = '2' 
WHERE puzzle_id = '2025-08-03';  -- It was never a phase

UPDATE solve_events 
SET puzzle_id = '3' 
WHERE puzzle_id = '2025-07-27';  -- Disney on Ice

-- Verify the migration worked by showing the updated records
-- (This is just for verification, remove in production if needed)
SELECT 'solves table:' as table_name, puzzle_id, solve_count FROM solves WHERE puzzle_id IN ('1', '2', '3')
UNION ALL
SELECT 'solve_events table:' as table_name, puzzle_id, COUNT(*) as event_count FROM solve_events WHERE puzzle_id IN ('1', '2', '3') GROUP BY puzzle_id;
