# Block Title

Renders the block's configured title as a string, or empty if the title cannot be determined.

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

The maximum length that the block title string may be before truncated. The default is stored in `MAXIMUM_TITLE_LENGTH`.

-   Type: `Number`
-   Required: No
