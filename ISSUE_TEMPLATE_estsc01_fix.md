# Fix estsc01.py Data Insertion Issue

## Problem Description

The `process_estsc01.py` script processes the `estsc01.txt` file successfully (9,879 lines processed, 9,794 records reported as inserted), but the database table `estoque_estsc01` remains empty after execution.

## Expected Behavior
- Script should insert 9,794 records into `estoque_estsc01` table
- Table should contain parsed data from `estsc01.txt`

## Actual Behavior
- Script reports successful processing and insertion
- Table `estoque_estsc01` shows 0 records
- No error messages during execution

## Steps to Reproduce
1. Run `python scripts/process_estsc01.py`
2. Check table contents: `SELECT COUNT(*) FROM estoque_estsc01;`
3. Result: 0 records

## Possible Causes
- Transaction rollback issue
- Database connection problems
- Commit not being executed properly
- Data parsing issues causing silent failures

## Files Involved
- `scripts/process_estsc01.py` - Main processing script
- `scripts/verificar_estsc01.py` - Verification script
- `bases/estoque/estsc01.txt` - Source data file

## Environment
- Python 3.x
- MySQL database
- Windows environment

## Related Scripts
- `process_fatex01.py` - Working reference implementation
- `process_confec01.py` - Working implementation with same structure

## TODO
- [ ] Debug transaction handling
- [ ] Check database connection stability
- [ ] Verify data parsing logic
- [ ] Compare with working scripts (fatex01, confec01)
- [ ] Test with smaller dataset first
- [ ] Add more detailed error logging