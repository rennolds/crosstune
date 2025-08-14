-- PRODUCTION Migration to update themed puzzle IDs from dates to numeric IDs
-- 
-- This script maps:
-- 2025-08-10 (Marvelous Motown) -> 1
-- 2025-08-03 (It was never a phase) -> 2  
-- 2025-07-27 (Disney on Ice) -> 3
--
-- IMPORTANT: Review the existing data before running this on production!
-- Check for any existing records with puzzle_id = '1', '2', or '3'

-- Step 1: Check for conflicts (run this first to see what exists)
-- SELECT puzzle_id, solve_count FROM solves WHERE puzzle_id IN ('1', '2', '3', '2025-08-10', '2025-08-03', '2025-07-27');

-- Step 2: If there are conflicts with IDs 1, 2, 3, decide how to handle them
-- Option A: Delete them if they're test data
-- DELETE FROM solves WHERE puzzle_id IN ('1', '2', '3');
-- DELETE FROM solve_events WHERE puzzle_id IN ('1', '2', '3');
--
-- Option B: Back them up first if they contain real data
-- CREATE TABLE solves_backup AS SELECT * FROM solves WHERE puzzle_id IN ('1', '2', '3');

-- Step 3: Perform the migration
UPDATE solves 
SET puzzle_id = '1' 
WHERE puzzle_id = '2025-08-10';  -- Marvelous Motown

UPDATE solves 
SET puzzle_id = '2' 
WHERE puzzle_id = '2025-08-03';  -- It was never a phase

UPDATE solves 
SET puzzle_id = '3' 
WHERE puzzle_id = '2025-07-27';  -- Disney on Ice

UPDATE solve_events 
SET puzzle_id = '1' 
WHERE puzzle_id = '2025-08-10';  -- Marvelous Motown

UPDATE solve_events 
SET puzzle_id = '2' 
WHERE puzzle_id = '2025-08-03';  -- It was never a phase

UPDATE solve_events 
SET puzzle_id = '3' 
WHERE puzzle_id = '2025-07-27';  -- Disney on Ice

-- Step 4: Verify the migration
SELECT 'Migration completed - themed puzzles:' as status, puzzle_id, solve_count 
FROM solves 
WHERE puzzle_id IN ('1', '2', '3') 
ORDER BY CAST(puzzle_id AS INTEGER);
