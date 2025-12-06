# BlockValidationIndicator

Visual indicator shown in the block toolbar when a block's content was regenerated from attributes (Validation Level 3).

## Usage

The component is automatically rendered in the block toolbar for blocks that pass validation at Level 3 (REGENERATED_BLOCK).

## Indicator Display
- Shows a small amber/warning-colored dot next to the block icon in the toolbar
- Only appears for blocks validated at Level 3 (REGENERATED_BLOCK)
- Not shown for Level 0 (perfect match), Level 1 (migrated), Level 2 (attribute-only reconstruction), or Level 4 (invalid).

## Modal Comparison
When the indicator is clicked, a modal opens showing:
- **Left column**: Original content from the database
- **Right column**: Regenerated content from the block's save() function