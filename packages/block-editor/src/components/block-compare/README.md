# Block Compare

A comparison component that shows two blocks side-by-side along with differences in HTML highlighted. This is typically used to show the current block and the results
of converting the block.

A button is present on both blocks to then select one or the other.

#### Props

##### block

The original object to compare against

-   Type: `Object`
-   Required: Yes

##### convertor

A function that returns a new, converted, block when supplied an existing block. The conversion may fix or alter the block in a way that helps with an invalid block.

-   Type: `func`
-   Required: Yes

##### convertButtonText

Text to show in the convert button

-   Type: `string`
-   Required: Yes

##### onKeep

Callback when the original block is required

-   Type: `func`
-   Required: Yes

##### onConvert

Callback when the converted block is required.

-   Type: `func`
-   Required: Yes
