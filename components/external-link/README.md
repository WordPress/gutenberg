# ExternalLink

This component is used to implement links that open in a new browser's tab.

## Props

The component accepts the following props. Any additional props will be passed to the rendered element. The additional props `isPrimary, isLarge, isSmall` determine whether the link is styled like a button.

### href

The HTML href attribute of the link. If omitted, the element will be rendered as a disabled button.

- Type: `string`
- Required: No

### target

The HTML target attribute of the link.

- Type: `string`
- Required: No
- Default: `_blank`

### rel

The HTML rel attribute of the link. It is possible to pass an additional value or pass `null` to omit the rel attribute entirely.

- Type: `string` | `null`
- Required: No
- Default: `external noreferrer noopener`

### icon

Whether to display the `external` dashicon.

- Type: `Boolean`
- Required: No
- Default: `true`

### opensInNewTabText

Alternative translatable text to use as the visually hidden accessible text.

- Type: `Function`
- Required: No
- Default: `__( '(opens in a new tab)' )`

### className

An optional additional CSS class to apply to the rendered link.

- Type: `String`
- Required: No

### children

The content to be displayed within the link.

- Type: `Element`
- Required: Yes
