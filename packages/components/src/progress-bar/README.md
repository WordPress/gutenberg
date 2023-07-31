# ProgressBar

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A simple horizontal progress bar component.

Supports two modes: determinate and indeterminate. A progress bar is determinate when a specific progress value has been specified (from 0 to 100), and indeterminate when a value hasn't been specified.

### Props

The component accepts the following props:

#### `value`: `number`

The progress value, a number from 0 to 100.
If a `value` is not specified, the progress bar will be considered indeterminate.

-   Required: No

##### `className`: `string`

A CSS class to apply to the underlying `div` element, serving as a progress bar track.

- Required: No

##### `id`: `string`

The HTML `id` of the `progress` element. This is necessary to be able to accessibly associate the label with that element.

-   Required: No
