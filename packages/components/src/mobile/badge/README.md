# Badge

The Badge component is designed to be wrapped around another component. It adds a "badge" with some text to the child component's upper left.

An example can be found in the image block. After setting an image as featured, a "featured" badge overlays the block.

### Usage

```jsx
return
<Badge label={ __( 'Hello World!' ) } show={ optionalBoolean }/>
    <View></View>
</Badge>;
```

### Props

#### label

The text that will be displayed within the Badge component.

-   Type: `String`
-   Required: Yes

#### show

An optional boolean to determine whether the badge is displayed.

-   Type: `Boolean`
-   Required: No
-   Default: `true`
