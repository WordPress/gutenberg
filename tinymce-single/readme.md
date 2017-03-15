# Editor Blocks Prototype with a Single TinyMCE Instance

## wp.blocks

### registerBlock( settings )

* name
* namespace
* displayName
* icon: Gridicon ID.
* type: Section to show the block in. (e.g. text)
* keywords: Array of keywords to search.
* editable:
  * `true` makes the whole area editable
  * `false` leaves the whole area non editable (default)
  * Array of selectors to define editable areas
* placeholders: Object of selectors (keys) and the placeholder text (value).
* insert: Function to call to insert an _empty_ block. Function should return a string.
* fromBaseState( HTMLElement ): Function that converts the block from its base state to the new state (used for type switching).
* toBaseState( HTMLElement ): Function that converts the block to its base state (used for type switching).
* controls: Array of controls
  * icon: Gridicon ID.
  * onClick( HTMLElement ): Handle click.
  * isActive( HTMLElement ): Funtion to determing active state.
  * classes: Custom classes.
* onSelect( HTMLElement ): Handle selection. E.g. show caption placeholders.
* onDeselect( HTMLElement ): Handle Deselect.
* onClick( event, HTMLElement ): Custom click handler. E.g. file picker for placeholder image.
* onPaste( event, HTMLElement ): Custom paste handler (with processed content).

Registration files: https://github.com/WordPress/gutenberg/tree/master/tinymce-single/blocks
