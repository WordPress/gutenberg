# Block Title

The Block Title component renders a block's configured title as a string.

It prioritizes contextual titles such as block variation and reusable block labels when returning a value. If none is found, it will return the display title specified in the block's metadata.

The component will be empty if a title cannot be determined.


## Usage

```jsx
<BlockTitle clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" maximumLength={ 12 }/>
```

### Props

#### clientId

The client ID of a block.

-   Type: `String`
-   Required: Yes

#### maximumLength

The maximum length that the block title string may be before truncated. If `undefined` no truncation will take place.

-   Type: `Number`
-   Required: No
