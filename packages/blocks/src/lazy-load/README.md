LazyLoad
====================

A wrapping block used to lazily-load script dependencies for a block. This can be used, for example, to wrap the `edit` of a syntax-highlighting code block to load the syntax-highlighting library only once the block is being edited.

This component also manages a cache, which is pre-hydrated by the server with already enqueued scripts and this component will prevent double-loading dependencies.

It works by blocking the rendering of `children` until the dependency is loaded.

## Usage

Given a library called `map-library` which loads an object onto window.mapLibrary, we can initialize this dependency using LazyLoad:

```jsx
const EmbeddedMapBlockEdit = () => {
		window.mapLibrary.drawMap();
};

const LazyEmbeddedMapBlockEdit = ( props ) => (
		<LazyLoad
			scripts={ [ 'map-library' ] }
			onLoaded={ () => window.mapLibrary.init() }
		>
			<EmbeddedMapBlockEdit { ...props } />
		</LazyLoad>
);
```
