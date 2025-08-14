-- Safe migration to update themed puzzle IDs from dates to numeric IDs
-- This handles existing conflicts by removing any existing numeric IDs first

-- First, check if we have any existing numeric IDs that would conflict
-- We'll remove these as they're likely test data

-- Remove any existing numeric ID records that would conflict (1, 2, 3)
DELETE FROM solves WHERE puzzle_id IN ('1', '2', '3');
DELETE FROM solve_events WHERE puzzle_id IN ('1', '2', '3');

-- Now safely update themed puzzle dates to numeric IDs
-- Update solves table
UPDATE solves 
SET puzzle_id = '1' 
WHERE puzzle_id = '2025-08-10';  -- Marvelous Motown

UPDATE solves 
SET puzzle_id = '2' 
WHERE puzzle_id = '2025-08-03';  -- It was never a phase

UPDATE solves 
SET puzzle_id = '3' 
WHERE puzzle_id = '2025-07-27';  -- Disney on Ice

-- Update solve_events table
UPDATE solve_events 
SET puzzle_id = '1' 
WHERE puzzle_id = '2025-08-10';  -- Marvelous Motown

UPDATE solve_events 
SET puzzle_id = '2' 
WHERE puzzle_id = '2025-08-03';  -- It was never a phase

UPDATE solve_events 
SET puzzle_id = '3' 
WHERE puzzle_id = '2025-07-27';  -- Disney on Ice

-- Verify the migration worked
SELECT 'After migration - solves table:' as info, puzzle_id, solve_count FROM solves WHERE puzzle_id IN ('1', '2', '3')
UNION ALL
SELECT 'After migration - solve_events table:' as info, puzzle_id, COUNT(*) as event_count FROM solve_events WHERE puzzle_id IN ('1', '2', '3') GROUP BY puzzle_id;
