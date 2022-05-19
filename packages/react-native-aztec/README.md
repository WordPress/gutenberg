# react-native-aztec

This package provides a component, AztecView, that wraps around the Aztec Android and Aztec iOS libraries in a React Native component.
This component provides rich text editing capabilities that emulate a subset of the HTML functionality.

# `RCTAztecView`

Render a rich text area that displays the HTML content provided.

## Usage

```jsx
import RCTAztecView from '@wordpress/react-native-aztec';

const RichText = () => (
	<>
		<RCTAztecView
			text={ {
				text: '<h1>This is a Heading</h1>',
				selection: { start: 0, end: 0 },
			} }
		/>
	</>
);
```

## Props

### text

Object with current HTML string to make editable and selection/caret position.

-   Type: `Object`, with the following attributes:
    -   text: HTML content
    -   selection:
    -   start, start position of selection
    -   end: end position of selection
    -   eventCount: if it has a value it's because this change was originated from the native event.
-   Required: Yes

### blockType

The block type, should contain a tagName prop that indicates what is the HTML tag that this editor displays.

-   Type: `Object`
-   Required: No
-   Android only

### isMultiline

By default, a line break will be inserted on <kbd>Enter</kbd>. If the editable field can contain multiple paragraphs, this property can be set to create new paragraphs on <kbd>Enter</kbd>.

-   Type: `Boolean`
-   Required: No

### activeFormats

The formats that are currently active. This is reflected on current state of the cursor.

-   Type: `Array`
-   Required: No

### disableEditingMenu

If active disables the contextual menu that allows setting text attributes like Bold/Italic/Strikethrough.

-   Type: `Boolean`
-   Required: No

### maxImagesWidth

The maximum width an image that is part of content provided can have.

-   Type: `Number`
-   Required: No

### minWidth

The minimum width the component can have.

-   Type: `Number`
-   Required: No

### maxWidth

The maximum width the component can have.

-   Type: `Number`
-   Required: No

### fontFamily

The font family that will be used as default to display the HTML content.

-   Type: `String`
-   Required: No

### fontSize

The font size that will be used as default to display the HTML content.

-   Type: `Number`
-   Required: No

### fontWeight

The font weight that will be used as default to display the HTML content.

-   Type: `String`
-   Required: No

### fontStyle

The font style (bold, italic, ) that will be used as default to display the HTML content.

-   Type: `String`
-   Required: No

### deleteEnter

When active removes the new line resulting from an enter keypress when that enter keypress is splitting the block.

-   Type: `Boolean`
-   Required: No
-   Android Only

### color

Text color.

-   Type: `Color`
-   Required: No

### selectionColor

The color to use for the caret and for the selection background.

-   Type: `Color`
-   Required: No

### placeholder

Placeholder text to show when the field is empty.

-   Type: `String`
-   Required: No

### placeholderTextColor

Placeholder text color.

-   Type: `Color`
-   Required: No

### textAlign

The alignment for the text displayed. Possible values: Left, Right, Center, Justify.

-   Type: `String`
-   Required: No

### onChange( value: Event )

-   Type: `function`
-   Required: No

### onKeyDown( value: Event )

Called when a key that belongs the triggerKeyCodes props is pressed.

-   Type: `function`
-   Required: No

### onFocus( value: Event )

Called when then native component is focused on, for example when tapped.

-   Type: `function`
-   Required: No

### onBlur( value: Event )

Called when then native component lost the focus.

-   Type: `function`
-   Required: No

### onPaste( value: Event )

Called when then native component has content pasted in.

-   Type: `function`
-   Required: No

### onContentSizeChange( value: Event )

Called when then native component size changed.

-   Type: `function`
-   Required: No

### onCaretVerticalPositionChange( value: Event )

Called when the vertical position of the caret changed. This can be used to scroll the container of the component to keep
the caret in focus.

-   Type: `function`
-   Required: No

### onSelectionChange( value: Event )

Called when then selection of the native component changed.

-   Type: `function`
-   Required: No

## Native Implementation details

### iOS

On iOS we use a native view called RCTAztecView that inherits an Aztec TextView class.
RCTAztecView adds the following custom behaviours to the TextView class:

-   Overlays a UILabel to display placeholder text
-   Overrides the `onPaste` method to intercept paste actions and send them to the JS implementation
-   Overrides the `insertText` and `deleteBackward` methods in order to detect the following keypresses:
    -   delete/backspace to allow handling of custom merge actions
    -   enter/new lines to allow handling of custom split actions
    -   detection any of triggerKeyCodes
-   Sets the `characterToReplaceLastEmptyLine` property in the HTMLConverter to be zero width space character to avoid the insertion of a newline at the end of the text blocks
-   Disables the `shouldCollapseSpaces` flag in the HTMLConverter in order to maintain all spaces inserted by the user

### Android

Android uses a native [`ReactAztecText`](https://github.com/WordPress/gutenberg/blob/7532a485b400f86638145b71f94f6f717e5add25/packages/react-native-aztec/android/src/main/java/org/wordpress/mobile/ReactNativeAztec/ReactAztecText.java#L50)
view, which extends [`AztecText`](https://github.com/wordpress-mobile/AztecEditor-Android/blob/437ecec9034003c32b9b8b0b00ec76cb5b248679/aztec/src/main/kotlin/org/wordpress/aztec/AztecText.kt#L130)
from the [Aztec Library for Android](https://github.com/wordpress-mobile/AztecEditor-Android). All interactions between
the native `ReactAztecText` view and the JavaScript code are handled by the [`ReactAztecManager`](https://github.com/WordPress/gutenberg/blob/7532a485b400f86638145b71f94f6f717e5add25/packages/react-native-aztec/android/src/main/java/org/wordpress/mobile/ReactNativeAztec/ReactAztecManager.java#L62)
view manager.

# License

GPL v2

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
