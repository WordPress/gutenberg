# BlockValidationIndicator

Indicator shown in the block toolbar when a block's markup was regenerated from its attributes while loading (validation Level 3, `REGENERATED_BLOCK` in `@wordpress/blocks`).

## Usage

The component is rendered by the block toolbar for blocks whose `validationLevel` is `REGENERATED_BLOCK`; it reads the level from the block in the block editor store.

## Indicator

-   Shows a small dot next to the block icon in the toolbar.
-   Only appears for Level 3 (`REGENERATED_BLOCK`): the stored markup differed structurally from the block's `save` output, but all of its content was preserved when regenerating it.
-   Not shown for Level 0 (exact match), Level 1 (migrated through a deprecation), Level 2 (reconstructed: the regenerated markup only adds attributes), or Level 4 (invalid, which shows the invalid block warning instead).

## Modal

Clicking the indicator opens a modal comparing the stored markup with the regenerated markup, with two actions:

-   **Restore original**: replaces the block with an HTML block containing the stored markup.
-   **Accept changes**: keeps the regenerated block and clears its validation metadata, so the indicator goes away.
