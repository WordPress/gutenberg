# Button

This component is used to implement buttons and links.
It's also used to implement links that open in a new browser's tab.

## Props

The component accepts the following props. Any additional props will be passed to the rendered `<a />` or `<button />` element. The presence of a `href` prop determines whether an anchor element is rendered instead of a button.

* `isPrimary`: (bool) whether the button is styled as a primary button.
* `isLarge`: (bool) whether the button is styled as a large button.
* `isSmall`: (bool) whether the button is styled as a small button.
* `isToggled`: (bool) whether the button is styled with an inversion of colors.
* `isBusy`: (bool) whether the button is styled with a "busy" animation.
* `disabled`: (bool) whether the `<button />` element is disabled.
* `href`: (string) if this property is added, it will use an `a` rather than a `button` element.
* `rel`: (string) the `rel` attribute for the `<a />` element.
* `target`: (string) the `target` attribute for the `<a />` element.
