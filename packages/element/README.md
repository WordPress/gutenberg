# Element

Element is, quite simply, an abstraction layer atop [React](https://reactjs.org/).

You may find yourself asking, "Why an abstraction layer?". For a few reasons:

-   In many applications, especially those extended by a rich plugin ecosystem as is the case with WordPress, it's wise to create interfaces to underlying third-party code. The thinking is that if ever a need arises to change or even replace the underlying implementation, it can be done without catastrophic rippling effects to dependent code, so long as the interface stays the same.
-   It provides a mechanism to shield implementers by omitting features with uncertain futures (`createClass`, `PropTypes`).
-   It helps avoid incompatibilities between versions by ensuring that every plugin operates on a single centralized version of the code.

On the `wp.element` global object, you will find the following, ordered roughly by the likelihood you'll encounter it in your code:

-   [`createElement`](https://reactjs.org/docs/react-api.html#createelement)
-   [`render`](https://reactjs.org/docs/react-dom.html#render)

## Installation

Install the module

```bash
npm install @wordpress/element --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Usage

Let's render a customized greeting into an empty element.

**Note:** `createRoot` was introduced with React 18, which is bundled with WordPress 6.2. Therefore it may be necessary to mount your component depending on which version of WordPress (and therefore React) you are currently using. This is possible by checking for an undefined import and falling back to the React 17 method of mounting an app using `render`.

Assuming the following root element is present in the page:

```html
<div id="greeting"></div>
```

We can mount our app:

```js
import { createRoot, render, createElement } from '@wordpress/element';

function Greeting( props ) {
	return createElement( 'span', null, 'Hello ' + props.toWhom + '!' );
}

const domElement = document.getElementById( 'greeting' );
const uiElement = createElement( Greeting, { toWhom: 'World' } );

if ( createRoot ) {
	createRoot( domElement ).render( uiElement );
} else {
	render( uiElement, domElement );
}
```

Refer to the [official React Quick Start guide](https://reactjs.org/docs/hello-world.html) for a more thorough walkthrough, in most cases substituting `React` and `ReactDOM` with `wp.element` in code examples.

## Why React?

At the risk of igniting debate surrounding any single "best" front-end framework, the choice to use any tool should be motivated specifically to serve the requirements of the system. In modeling the concept of a [block](https://github.com/WordPress/gutenberg/tree/HEAD/packages/blocks/README.md), we observe the following technical requirements:

-   An understanding of a block in terms of its underlying values (in the [random image example](https://github.com/WordPress/gutenberg/tree/HEAD/packages/blocks/README.md#example), a category)
-   A means to describe the UI of a block given these values

At its most basic, React provides a simple input / output mechanism. **Given a set of inputs ("props"), a developer describes the output to be shown on the page.** This is most elegantly observed in its [function components](https://reactjs.org/docs/components-and-props.html#functional-and-class-components). React serves the role of reconciling the desired output with the current state of the page.

The offerings of any framework necessarily become more complex as these requirements increase; many front-end frameworks prescribe ideas around page routing, retrieving and updating data, and managing layout. React is not immune to this, but the introduced complexity is rarely caused by React itself, but instead managing an arrangement of supporting tools. By moving these concerns out of sight to the internals of the system (WordPress core code), we can minimize the responsibilities of plugin authors to a small, clear set of touch points.

## JSX

While not at all a requirement to use React, [JSX](https://reactjs.org/docs/introducing-jsx.html) is a recommended syntax extension to compose elements more expressively. Through a build process, JSX is converted back to the `createElement` syntax you see earlier in this document.

If you've configured [Babel](http://babeljs.io/) for your project, you can opt in to JSX syntax by specifying the `pragma` option of the [`transform-react-jsx` plugin](https://www.npmjs.com/package/babel-plugin-transform-react-jsx) in your [`.babelrc` configuration](http://babeljs.io/docs/usage/babelrc/).

```json
{
	"plugins": [
		[
			"transform-react-jsx",
			{
				"pragma": "createElement"
			}
		]
	]
}
```

This assumes that you will import the `createElement` function in any file where you use JSX. Alternatively, consider using the [`@wordpress/babel-plugin-import-jsx-pragma` Babel plugin](https://www.npmjs.com/package/@wordpress/babel-plugin-import-jsx-pragma) to automate the import of this function.

## API

<!-- START TOKEN(Autogenerated API docs) -->

### Children

_Related_

-   <https://reactjs.org/docs/react-api.html#children>

### cloneElement

_Related_

-   <https://reactjs.org/docs/react-api.html#cloneelement>

### Component

_Related_

-   <https://reactjs.org/docs/react-api.html#component>

### concatChildren

Object containing a React synthetic event.

_Type Definition_

-   _WPSyntheticEvent_ `import('react').SyntheticEvent`

### createContext

_Related_

-   <https://reactjs.org/docs/react-api.html#createcontext>

### createElement

Undocumented declaration.

### createInterpolateElement

This function creates an interpolated element from a passed in string with specific tags matching how the string should be converted to an element via the conversion map value.

_Usage_

For example, for the given string:

"This is a <span>string</span> with <a>a link</a> and a self-closing
<CustomComponentB/> tag"

You would have something like this as the conversionMap value:

```js
{
    span: <span />,
    a: <a href={ 'https://github.com' } />,
    CustomComponentB: <CustomComponent />,
}
```

_Parameters_

-   _interpolatedString_ `string`: The interpolation string to be parsed.
-   _conversionMap_ `Record<string, WPElement>`: The map used to convert the string to a react element.

_Returns_

-   `WPElement`: A wp element.

### createPortal

Creates a portal into which a component can be rendered.

_Related_

-   <https://github.com/facebook/react/issues/10309#issuecomment-318433235>

_Parameters_

-   _child_ `import('./react').WPElement`: Any renderable child, such as an element, string, or fragment.
-   _container_ `HTMLElement`: DOM node into which element should be rendered.

### createRef

_Related_

-   <https://reactjs.org/docs/react-api.html#createref>

### createRoot

Creates a new React root for the target DOM node.

_Related_

-   <https://react.dev/reference/react-dom/client/createRoot>

_Changelog_

`6.2.0` Introduced in WordPress core.

### EnvironmentContext

Undocumented declaration.

### findDOMNode

Finds the dom node of a React component.

_Parameters_

-   _component_ `import('./react').WPComponent`: Component's instance.

### flushSync

Forces React to flush any updates inside the provided callback synchronously.

_Parameters_

-   _callback_ `Function`: Callback to run synchronously.

### forwardRef

_Related_

-   <https://reactjs.org/docs/react-api.html#forwardref>

### Fragment

_Related_

-   <https://reactjs.org/docs/react-api.html#fragment>

### hydrate

> **Deprecated** since WordPress 6.2.0. Use `hydrateRoot` instead.

Hydrates a given element into the target DOM node.

_Related_

-   <https://react.dev/reference/react-dom/hydrate>

### hydrateRoot

Creates a new React root for the target DOM node and hydrates it with a pre-generated markup.

_Related_

-   <https://react.dev/reference/react-dom/client/hydrateRoot>

_Changelog_

`6.2.0` Introduced in WordPress core.

### isEmptyElement

Checks if the provided WP element is empty.

_Parameters_

-   _element_ `*`: WP element to check.

_Returns_

-   `boolean`: True when an element is considered empty.

### isValidElement

_Related_

-   <https://reactjs.org/docs/react-api.html#isvalidelement>

### lazy

_Related_

-   <https://reactjs.org/docs/react-api.html#reactlazy>

### memo

_Related_

-   <https://reactjs.org/docs/react-api.html#reactmemo>

### Platform

Component used to detect the current Platform being used. Use Platform.OS === 'web' to detect if running on web enviroment.

This is the same concept as the React Native implementation.

_Related_

-   <https://facebook.github.io/react-native/docs/platform-specific-code#platform-module> Here is an example of how to use the select method:

_Usage_

```js
import { Platform } from '@wordpress/element';

const placeholderLabel = Platform.select( {
	native: __( 'Add media' ),
	web: __(
		'Drag images, upload new ones or select files from your library.'
	),
} );
```

### RawHTML

Component used as equivalent of Fragment with unescaped HTML, in cases where it is desirable to render dangerous HTML without needing a wrapper element. To preserve additional props, a `div` wrapper _will_ be created if any props aside from `children` are passed.

_Parameters_

-   _props_ `RawHTMLProps`: Children should be a string of HTML or an array of strings. Other props will be passed through to the div wrapper.

_Returns_

-   `JSX.Element`: Dangerously-rendering component.

### registerDirective

Registers a new directive.

_Parameters_

-   _name_ `string`: Name of the directive.
-   _handler_ `Function`: Handler for the directive.

### render

> **Deprecated** since WordPress 6.2.0. Use `createRoot` instead.

Renders a given element into the target DOM node.

_Related_

-   <https://react.dev/reference/react-dom/render>

### renderToString

Serializes a React element to string.

_Parameters_

-   _element_ `import('react').ReactNode`: Element to serialize.
-   _context_ `[Object]`: Context object.
-   _legacyContext_ `[Object]`: Legacy context object.

_Returns_

-   `string`: Serialized element.

### startTransition

_Related_

-   <https://reactjs.org/docs/react-api.html#starttransition>

### StrictMode

_Related_

-   <https://reactjs.org/docs/react-api.html#strictmode>

### Suspense

_Related_

-   <https://reactjs.org/docs/react-api.html#reactsuspense>

### switchChildrenNodeName

Switches the nodeName of all the elements in the children object.

_Parameters_

-   _children_ `?Object`: Children object.
-   _nodeName_ `string`: Node name.

_Returns_

-   `?Object`: The updated children object.

### unmountComponentAtNode

> **Deprecated** since WordPress 6.2.0. Use `root.unmount()` instead.

Removes any mounted element from the target DOM node.

_Related_

-   <https://react.dev/reference/react-dom/unmountComponentAtNode>

### useCallback

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#usecallback>

### useContext

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#usecontext>

### useDebugValue

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#usedebugvalue>

### useDeferredValue

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#usedeferredvalue>

### useEffect

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#useeffect>

### useId

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#useid>

### useImperativeHandle

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#useimperativehandle>

### useInsertionEffect

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#useinsertioneffect>

### useLayoutEffect

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#uselayouteffect>

### useMemo

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#usememo>

### useReducer

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#usereducer>

### useRef

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#useref>

### useState

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#usestate>

### useSyncExternalStore

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#usesyncexternalstore>

### useTransition

_Related_

-   <https://reactjs.org/docs/hooks-reference.html#usetransition>

<!-- END TOKEN(Autogenerated API docs) -->

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
