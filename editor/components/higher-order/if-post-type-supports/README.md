ifPostTypeSupports
==================

`ifPostTypeSupports` is a higher-order component creator which only renders its wrapped component if the current post type supports the given support key(s).

## Usage

Call `ifPostTypeSupports` with a support key or array of keys, one of which must be supported for the current post type being edited.

The return value is a function which can be called with a component that should render only if the post type offers the required support. This results in a new enhanced component.

```jsx
function MyFeaturedImage() {
	return <img />;
}

export default ifPostTypeSupports( 'thumbnail' )( MyFeaturedImage );
```

For a full list of post type support keys, refer to [the `add_post_type_support` function documentation](https://codex.wordpress.org/Function_Reference/add_post_type_support).

## Multiple Supports

`ifPostTypeSupports` can be called with a single support key:

```js
ifPostTypeSupports( 'thumbnail' )( MyFeaturedImage );
```

…or an array of support keys:

```js
ifPostTypeSupports( [ 'thumbnail', 'post-formats' ] )( MyFeaturedImage );
```

In this example, the original component will be rendered if the post type supports _either_ thumbnail _or_ post formats.

If you want the component to render only if the post type supports _both_ thumbnail _and_ post formats, chain multiple `ifPostTypeSupports`:

```js
compose( [
	ifPostTypeSupports( 'thumbnail' ),
	ifPostTypeSupports( 'post-formats' ),
] )( MyFeaturedImage );
```
