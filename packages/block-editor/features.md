# Block Editor Features

This document describes all the block editor features and behaviours based on user expectations and popular behaviour.

It is also used as a guide for writing and organising end-to-end tests.

## Common Language (General Behaviour)

All the editor interactions are fully based on a simple, common language that people can use to interact with a computer. The keyboard and the pointer device are used as tools for this.

### Keys

A key is an individual key on a keyboard. Keys are named based on `KeyboardEvent.key`. This list is based on https://www.w3.org/TR/uievents-key/#named-key-attribute-values.

Only keys that are universal must be used for the most important interactions.

Continuous pressing should result in multiple executions.

* `ArrowDown`: The down arrow ("↓") key, to navigate or traverse downward.
* `ArrowLeft`: The left arrow ("←") key, to navigate or traverse leftward.
* `ArrowRight`: The right arrow ("→") key, to navigate or traverse rightward.
* `ArrowUp`: The up arrow ("↑") key, to navigate or traverse upward.
* `Backspace`: The "Backspace" key. This key value is also used for the key labeled Delete on MacOS keyboards.
* `Delete`: The "Delete" ("Del") Key. This key value is also used for the key labeled Delete on MacOS keyboards when modified by the "Fn" key.
* `Enter`: The enter ("↵"") key, to activate current selection or accept current input. This key value is also used for the "Return" (Macintosh numpad) key.
* `Tab`:  The horizontal tabulation ("Tab" or "↹") key.
* ` `: The space or spacebar (" ") key.
* `Escape`: The "Esc" key. This key was originally used to initiate an escape sequence, but is	now more generally used to exit or "escape" the current context, such as closing a dialog or exiting full screen mode.

### Input

Input is usually caused by the keyboard. Interpreting input is sometimes more reliable than interpreting keys, and the user intent is much better defined. Additionally, there may be more or different (unknown) key combinations causing the same input type, depening on the operating system and language. The downside is that they are only triggered inside an editable area.

Full list: https://w3c.github.io/input-events/#interface-InputEvent-Attributes.

### Pointer Device

Can be used on:

* Character.
* Object.
* Button.

### Click or Tap

The pointer starts and ends at the same position.

### Drag and Drop

The pointer start and ends at a different position.

## Text Editor Specific Behaviour

Text editors have the added complexity of having a selection, which should be manipulatable by the keyboard or pointer device. Beaviour is loosly based on general behaviour, and `textarea` and basic text editor behaviour, which varies slightly by operating system. (Is there any spec with these behaviours?)

### Keys

To do: with modifiers.

* `ArrowDown`:
    1. _collapse_ the active selection backward.
    2. Next line?
        * Yes: _move_ the selection to the next line with the same horizontal offset from the left as the active selection.
        * No: _move_ the selection to the end of the line if possible.
* `ArrowLeft`:
    1. Collapsed selection?
        * Yes: _move_ the selection forward by one character if possible.
        * No: _collapse_ the selection forward.
* `ArrowRight`:
    1. Collapsed selection?
        * Yes: _move_ the selection backward by one character if possible.
        * No: _collapse_ the selection backward.
* `ArrowUp`:
    1. _collapse_ the active selection backward.
    2. Previous line?
        * Yes: _move_ the selection to the previous line with the same horizontal offset from the left as the active selection.
        * No: _move_ the selection to the start of the line if possible.
* `Backspace`:
    1. Collapsed selection?
        * Yes: _remove_ the character before the selection if possible.
        * No: _remove_ the selection content.
* `Delete`:
    1. Collapsed selection?
        * Yes: _remove_ the character after the selection if possible.
        * No: _remove_ the selection content.
* `Enter`: _Replace_ the active selection with a line break.
* `Tab`:  _Focus_ the next tabbable element if in browser context (?).
* ` `: _Insert_ a space character.

## Rich Text Editor Specific Behaviour

Keyboard and pointer device behaviour is inherited from the [Text Editor Specific Behaviour](#) unless otherwise stated.

### Formatting

#### Format Boundaries.

* `ArrowLeft`:
    1. Collapsed selection?
        * Move into the previous format boundary position if possible, otherwise _move_ the selection forward by one character if possible.
        * No: _collapse_ the selection forward.
* `ArrowRight`:
    1. Collapsed selection?
        * Move into the next format boundary position if possible, otherwise _move_ the selection forward by one character if possible.
        * No: _collapse_ the selection backward.

#### Bold

The Bold feature marks a part of the text with strong importance.

On/off feature.

* Button: `B` icon. (Consider allowing translation or different icon.)
* Key combination: `Ctrl/Cmd+B`. (Consider using `InputEvent.inputType` instead as the comination may depend on the language and OS.)
* HTML Markup: [`<strong>`](https://www.w3.org/TR/html5/text-level-semantics.html#the-strong-element).

Although this feature should be called “Important” or “Strong Importance”, for historical reasons users are used to the "Bold" name. Therefore, for consistency and due to better recognition, this feature should generally be referred to as Bold.

#### Italic

The Italic feature marks a part of the text offset from the normal prose in a manner indicating a different quality of text.

On/off feature.

* Button: `I` icon. (Consider allowing translation or different icon.)
* Key combination: `Ctrl/Cmd+I`. (Consider using `InputEvent.inputType` instead as the comination may depend on the language and OS.)
* HTML Markup: [`<em>`](https://www.w3.org/TR/html5/text-level-semantics.html#the-em-element). (Consider using the [`<i>`](https://www.w3.org/TR/html5/text-level-semantics.html#the-i-element).)

#### Link

The Link feature provides the user with the ability to link some parts of content to other web resources or other parts of the same content. This feature inserts a new link with a specified text or transforms the selected, previously existing text into a link.

* Button: `🔗` icon.
* Key combination: `Ctrl/Cmd+K`. (Consider using `InputEvent.inputType` instead as the comination may depend on the language and OS.)
* HTML Markup: [`<a>`](https://www.w3.org/TR/html5/text-level-semantics.html#the-a-element).

To do: explain insertion and removal procedure. Explain attributes.

Pasting a link over a piece of text should link the text.

#### Strikethrough

* Button: `ABC` (striken through) icon.
* Key combination: `Ctrl/Cmd+?`. (Consider removing as it may conlict.)
* HTML Markup: [`<s>`](https://www.w3.org/TR/html5/text-level-semantics.html#the-s-element).

#### Inline Code

* Button: `<>` icon.
* Key combination: `Ctrl/Cmd+?`. (Consider removing as it may conlict.)
* Transform: wrap text with `` ` ``.
* HTML Markup: [`<s>`](https://www.w3.org/TR/html5/text-level-semantics.html#the-code-element).

#### Inline Image

* Button: inline image icon.
* HTML Markup: [`<img>`](https://www.w3.org/TR/html5/text-level-semantics.html#the-code-element).

...

#### Mentions

...

### Blocks

Block selection:

* `ArrowDown`: _select_ the next block.
* `ArrowLeft`: _select_ the previous block.
* `ArrowRight`: _select_ the next block.
* `ArrowUp`: _select_ the previous block.
* `Backspace`: _remove_ the selected blocks and _select_ the previous block.
* `Delete`: _remove_ the selected blocks and _select_ the next block.
* `Enter`:
    1. Multiple blocks selected?
        * Yes: _Replace_ the selection with a paragraph block.
        * No: _insert_ a paragraph block **after** the selected block, and _select_ it.
* `Tab`: _Select_ the next block.
* `Shift+Tab`: _Select_ the previous block.
* ` `: Do nothing.

Text selection (should be better defined):

* `ArrowDown` (at vertical edge): _select_ the next first possible vertical position.
* `ArrowLeft` (at horizontal edge): _select_ the previous first possible right position.
* `ArrowRight` (at horizontal edge): _select_ the previous first possible left position.
* `ArrowUp` (at vertical edge): _select_ the previous first possible vertical position.

Buttons:

* "Remove Block": _removes_ the selected block, and _select_ the previous block.

#### Paragraph

The default block.

* `Enter`:
    1. _remove_ the selected content if any.
    2. _split_ the content in two at the selected position.
    3. _replace_ selected block with two blocks of the same type and the split content. No attributes should be copied over if the content is empty.
* `Backspace` (at start position): _merge_ the selected blocks with the previous block if it can be transformed to the selected block type, otherwise do nothing.
* `Delete` (at end position): _merge_ the selected blocks with the next block if it can be transformed to the selected block type, otherwise do nothing.

#### Heading

* `Enter`:
    1. _remove_ the selected content if any.
    2. _split_ the content in two at the selected position.
    3. _replace_ selected block with two blocks of the same type and the split content. No attributes should be copied over if the content is empty.
* `Backspace` (at start position): _merge_ the selected blocks with the previous block if it can be transformed to the selected block type, otherwise do nothing.
* `Delete` (at end position): _merge_ the selected blocks with the next block if it can be transformed to the selected block type, otherwise do nothing.

#### Image

* Should always be wrapped in a `<figure>` tag.

#### Gallery

* Should always be wrapped in a `<figure>` tag.

#### List

##### Ordered

##### Unordered

#### Quote

#### Table

* Consider always wrapping in a `<figure>` tag.

## Copy, Cut, and Paste

## Undo/Redo

## Data transformation

## Syntax highlighting

### mention



