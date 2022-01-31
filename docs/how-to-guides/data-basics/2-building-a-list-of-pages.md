# Building a list of pages

In this part, we will build a filterable list of all WordPress pages. This is what the app will look like at the end of
this part:

![](./media/list-of-pages/part1-finished.jpg)

Let’s see how we can get there step by step.

## Step 1: Build the PagesList component

Let’s start by building a minimal React component to display the list of pages:

```js
function MyFirstApp() {
	const pages = [{ id: 'mock', title: 'Sample page' }]
	return <PagesList pages={ pages }/>;
}

function PagesList( { pages } ) {
	return (
		<ul>
			{ pages?.map( page => (
				<li key={ page.id }>
					{ page.title }
				</li>
			) ) }
		</ul>
	);
}
```

<details><summary>Compiled snippet</summary>

```js
function MyFirstApp() {
	const pages = [{ id: 'mock', title: 'Sample page' }]
	return (
		wp.element.createElement( PagesList, { pages } )
	)
}

function PagesList( { pages } ) {
	return (
		wp.element.createElement( 'ul', {},
			pages?.map( page => (
				wp.element.createElement( 'li', { key: page.id }, page.title )
			) )
		)
	)
}
```

</details>

Note that this component does not fetch any data yet, only presents the hardcoded list of pages. When you refresh the page,
you should see the following:

![](./media/list-of-pages/simple-list.jpg)

## Step 2: Fetch the data

The hard-coded sample page isn’t very useful. We want to display your actual WordPress pages so let’s fetch the actual
list of pages from the WordPress API.

Before we start, let’s confirm we actually have some pages to fetch. Navigate to Pages using the sidebar menu and
ensure it shows at least four or five positions:

![](./media/list-of-pages/pages-list.jpg)

If it doesn’t, go ahead and create a few pages – you can use the same titles as on the screenshot above. Be sure to _
publish_ and not just _save_ them.

Now that we have the data to work with, let’s dive into the code. We will take advantage of the Gutenberg’s `coreData`
package which provides resolvers, selectors, and actions to work with the WordPress core API. `coreData` builds on top
of the [Gutenberg’s `data`  package](https://github.com/WordPress/gutenberg/tree/trunk/packages/data).

To fetch the list of pages, we will use
the [`getEntityRecords`](/docs/reference-guides/data/data-core/#getentityrecords) selector. In broad strokes, it will
issue the correct API request, cache the results, and return the list of the records we need. Here’s how to use it:

```js
wp.data.select( 'core' ).getEntityRecords( 'postType', 'page' )
```

If you run that following snippet in your browser’s dev tools, you will see it returns `null`. Why? The pages are only
requested by `getEntityRecords` resolver after first running the selector. If you wait a moment and re-run it, it
will return the list of all pages.

Similarly, the `MyFirstApp` component needs to re-run the selector once the data is available. That’s exactly what
the `useSelect` hook does:

```js
function MyFirstApp() {
	const pages = wp.data.useSelect(
		select =>
			select( wp.coreData.store ).getEntityRecords( 'postType', 'page' ),
		[]
	);
	// ...
}
```

`useSelect` takes two arguments: a callback and dependencies. In broad strokes, it re-runs the callback whenever either
the dependencies or the underlying data store changes. You can learn more about [useSelect](#) in
the [data module documentation](/packages/data/README.md#useselect).

Putting it together, we get the following code:

```js
function MyFirstApp() {
	const pages = wp.data.useSelect(
		select =>
			select( wp.coreData.store ).getEntityRecords( 'postType', 'page' ),
		[]
	);
	return <PagesList pages={ pages }/>;
}

function PagesList( { pages } ) {
	return (
		<ul>
			{ pages?.map( page => (
				<li key={ page.id }>
					{ page.title.rendered }
				</li>
			) ) }
		</ul>
	)
}
```

<details><summary>Compiled snippet</summary>

```js
function MyFirstApp() {
	const pages = wp.data.useSelect(
		select =>
			select( wp.coreData.store ).getEntityRecords( 'postType', 'page' ),
		[]
	);
	return (
		wp.element.createElement( PagesList, { pages } )
	)
}

function PagesList( { pages } ) {
	return (
		wp.element.createElement( 'ul', {},
			pages?.map( page => (
				wp.element.createElement( 'li', { key: page.id }, page.title )
			) )
		)
	)
}
```

</details>

Refreshing the page should display a list similar to this one:

![](./media/list-of-pages/fetch-the-data.jpg)

## Step 3: Turn it into a table

```js
function PagesList( { pages } ) {
	return (
		<table className="wp-list-table widefat fixed striped table-view-list">
			<thead>
				<tr>
					<td>Title</td>
				</tr>
			</thead>
			<tbody>
				{ pages?.map( page => (
					<tr key={ page.id }>
						<td>{ page.title.rendered }</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
}
```

<details><summary>Compiled snippet</summary>

```js
function PagesList( { pages } ) {
	return wp.element.createElement(
		'table',
		{ className: 'wp-list-table widefat fixed striped table-view-list' },
		wp.element.createElement( 'thead', {},
			wp.element.createElement( 'tr', {},
				wp.element.createElement( 'td', {}, 'Title' ),
			),
		),
		wp.element.createElement( 'tbody', {},
			pages?.map( page => (
				wp.element.createElement( 'tr', { key: page.id },
					wp.element.createElement( 'td', {}, page.title.rendered ),
				)
			) ),
		),
	);
}
```

</details>

![](./media/list-of-pages/make-a-table.jpg)

## Step 4: Add a search Box

The list of pages is short for now; however, the longer it grows, the harder it is to work with. WordPress admins
typically solves this problem with a search box – let’s implement one, too!

Let’s start by adding a search field:

```js
const { SearchControl } = wp.components;
function MyFirstApp() {
	const [searchTerm, setSearchTerm] = wp.element.useState( '' );
	// ...
	return (
		<div>
			<SearchControl
				onChange={ setSearchTerm }
				value={ searchTerm }
			/>
			{/* ... */ }
		</div>
	)
}
```

<details><summary>Compiled snippet</summary>

```js
function MyFirstApp() {
	const [searchTerm, setSearchTerm] = wp.element.useState( '' );
	// ...
	return (
		wp.element.createElement( 'div', {},
			wp.element.createElement( wp.components.SearchControl, {
				onChange: setSearchTerm,
				value: searchTerm,
			} ),
			// ...
		)
	)
}
```

</details>

Note that instead of using an `input` tag, we took advantage of
the [SearchControl](https://developer.wordpress.org/block-editor/reference-guides/components/search-control/) component.
This is what it looks like:

![](./media/list-of-pages/filter-field.jpg)

The field starts empty, and the contents are stored in the `searchTerm` state value. If you aren’t familiar with
the [useState](https://reactjs.org/docs/hooks-state.html) hook, you can learn more
in [React’s documentation](https://reactjs.org/docs/hooks-state.html).

We can now request only the pages matching the `searchTerm`.

After checking with the [WordPress API documentation]([https://developer.wordpress.org/rest-api/reference/pages/]), we
see that the [/wp/v2/pages]([https://developer.wordpress.org/rest-api/reference/pages/]) endpoint accepts a `search`
query parameter and uses it to  _Limit results to those matching a string_. But how to use it? We can pass custom query
parameters as the third argument to `getEntityRecords` as below:

```js
wp.data.select( 'core' ).getEntityRecords( 'postType', 'page', { search: 'home' } )
```

Running that snippet in your browser’s dev tools will trigger a request to `/wp/v2/pages?search=home` instead of
just `/wp/v2/pages`.

Let’s update our `useSelect` call as follows:

```js
function MyFirstApp() {
	// ...
	const { pages } = wp.data.useSelect( select => {
		const query = {};
		if ( searchTerm ) {
			query.search = searchTerm;
		}
		return {
			pages: select( wp.coreData.store ).getEntityRecords( 'postType', 'page', query )
		}
	}, [searchTerm] );

	// ...
}
```

The `searchTerm` is now used as a `search` query parameter when specified. Note that `searchTerm` is also specified
inside the list of `useSelect` dependencies to make sure `getEntityRecords` is re-run when the `searchTerm` changes.

Finally, here’s how `MyFirstApp` looks like once we wire it all together:

```js
const { SearchControl } = wp.components;
function MyFirstApp() {
	const [searchTerm, setSearchTerm] = wp.element.useState( '' );
	const pages = wp.data.useSelect( select => {
		const query = {};
		if ( searchTerm ) {
			query.search = searchTerm;
		}
		return select( wp.coreData.store ).getEntityRecords( 'postType', 'page', query );
	}, [searchTerm] );

	return (
		<div>
			<SearchControl
				onChange={ setSearchTerm }
				value={ searchTerm }
			/>
			<PagesList pages={ pages }/>
		</div>
	)
}
```

<details><summary>Compiled snippet</summary>

```js
function MyFirstApp() {
	const [searchTerm, setSearchTerm] = wp.element.useState( '' );
	const pages = wp.data.useSelect( select => {
		const query = {};
		if ( searchTerm ) {
			query.search = searchTerm;
		}
		return select( wp.coreData.store ).getEntityRecords( 'postType', 'page', query );
	}, [searchTerm] );

	return (
		wp.element.createElement( 'div', {},
			wp.element.createElement( wp.components.SearchControl, {
				onChange: setSearchTerm,
				value: searchTerm,
			} ),
			wp.element.createElement( PagesList, { pages } ),
		)
	)
}
```

</details>

Voila! We can now filter the results:

![](./media/list-of-pages/filter.jpg)

### Gutenberg data vs working directly with the API

Let’s take a pause for a moment to consider an alternative approach. Imagine we sent the API requests directly:

```js
function MyFirstApp() {
	// ...
	const [pages, setPages] = useState( [] );
	useEffect( () => {
		const url = '/wp-json/wp/v2/pages?search=' + searchTerm;
		wp
			.apiFetch( { url } )
			.then( setPages )
	}, [searchTerm] );
	// ...
}
```

We would need to solve two problems here.

First, out-of-order updates. Searching for „About” would trigger five API requests filtering for A, Ab, Abo, Abou, and
About. They could finish in a different order than they started. It is possible that _search=A_ would resolve after _
search=About_ and we’d display the wrong data.

Gutenberg data helps by handling the asynchronous part behind the scenes. `useSelect` remembers the most recent call and
returns only the data we expect.

Second, every keystroke would trigger an API request. If you typed About, deleted it, and retyped it, it would
issue 10 requests in total even though we could reuse the data.

Gutenberg data helps by caching the responses to API requests triggered by `getEntityRecords()`  and reuses them on
subsequent calls. This is especially important when other components rely on the same entity records.

All in all, the built-in utilities are designed to solve the typical problems so that you can focus on your application
instead.

## Step 5: Loading Indicator

There is one problem with our search feature. We can’t be quite sure whether it’s still searching or showing no results:

![](./media/list-of-pages/unclear-status.jpg)

A few messages like  _Loading…_ or _No results_ would clear it up. Let’s implement them! First,  `PagesList` has to be
aware of the current status:

```js
const { Spinner } = wp.components;
function PagesList( { hasResolved, pages } ) {
	if ( !hasResolved ) {
		return <Spinner/>
	}
	if ( !pages?.length ) {
		return <div>No results</div>
	}
	// ...
}

function MyFirstApp() {
	// ...

	return (
		<div>
			// ...
			<PagesList hasResolved={ hasResolved } pages={ pages }/>
		</div>
	)
}
```

<details><summary>Compiled snippet</summary>

```js
function PagesList( { hasResolved, pages } ) {
	if ( !hasResolved ) {
		return wp.element.createElement( wp.components.Spinner );
	}
	if ( !pages?.length ) {
		return wp.element.createElement( 'div', {}, 'No results' );
	}
	// ...
}

function MyFirstApp() {
	// ...

	return (
		wp.element.createElement( 'div', {},
			// ...
			wp.element.createElement( PagesList, { hasResolved, pages } ),
		)
	)
}
```

</details>

Note that instead of building a custom loading indicator, we took advantage of
the [Spinner](https://developer.wordpress.org/block-editor/reference-guides/components/spinner/) component.

We still need to know whether the pages selector `hasResolved` or not. We can find out using
the  `hasFinishedResolution` selector:

`wp.data.select('core').hasFinishedResolution( 'getEntityRecords', [ 'postType', 'page', { search: 'home' } ] )`

It takes the name of the selector and the arguments and returns either `true` if the data was already loaded or `false`
it we’re still waiting. Let’s add it to `wp.data.useSelect`:

```js
function MyFirstApp() {
	// ...
	const { pages, hasResolved } = wp.data.useSelect( select => {
		// ...
		return {
			pages: {/* ... */ },
			hasResolved:
				select( wp.coreData.store ).hasFinishedResolution( 'getEntityRecords', ['postType', 'page', query] ),
		}
	}, [searchTerm] );

	// ...
}
```

All the pieces are in place, great! Here’s the complete JavaScript code of our app:

```js
const { SearchControl, Spinner } = wp.components;

function MyFirstApp() {
	const [searchTerm, setSearchTerm] = wp.element.useState( '' );
	const { pages, hasResolved } = wp.data.useSelect( select => {
		const query = {};
		if ( searchTerm ) {
			query.search = searchTerm;
		}
		return {
			pages: select( wp.coreData.store ).getEntityRecords( 'postType', 'page', query ),
			hasResolved: select( wp.coreData.store )
				.hasFinishedResolution( 'getEntityRecords', ['postType', 'page', query] ),
		};
	}, [searchTerm] );

	return (
		<div>
			<SearchControl
				onChange={ setSearchTerm }
				value={ searchTerm }
			/>
			<PagesList hasResolved={ hasResolved } pages={ pages }/>
		</div>
	);
}

function PagesList( { hasResolved, pages } ) {
	if ( !hasResolved ) {
		return <Spinner/>
	}
	if ( !pages?.length ) {
		return <div>No results</div>;
	}

	return (
		<table className="wp-list-table widefat fixed striped table-view-list">
			<thead>
				<tr>
					<td>Title</td>
				</tr>
			</thead>
			<tbody>
				{ pages?.map( page => (
					<tr key={ page.id }>
						<td>{ page.title.rendered }</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
}
```

<details><summary>Compiled snippet</summary>

```js

function MyFirstApp() {
	const [searchTerm, setSearchTerm] = wp.element.useState( '' );
	const { pages, hasResolved } = wp.data.useSelect( select => {
		const query = {};
		if ( searchTerm ) {
			query.search = searchTerm;
		}
		return {
			pages: select( wp.coreData.store ).getEntityRecords( 'postType', 'page', query ),
			hasResolved: select( wp.coreData.store )
				.hasFinishedResolution( 'getEntityRecords', ['postType', 'page', query] ),
		};
	}, [searchTerm] );

	return (
		wp.element.createElement( 'div', {},
			wp.element.createElement( wp.components.SearchControl, {
				onChange: setSearchTerm,
				value: searchTerm,
			} ),
			wp.element.createElement( PagesList, { hasResolved, pages } ),
		)
	);
}

function PagesList( { hasResolved, pages } ) {
	if ( !hasResolved ) {
		return wp.element.createElement( wp.components.Spinner );
	}
	if ( !pages?.length ) {
		return wp.element.createElement( 'div', {}, 'No results' );
	}

	return wp.element.createElement(
		'table',
		{ className: 'wp-list-table widefat fixed striped table-view-list posts' },
		wp.element.createElement( 'thead', {},
			wp.element.createElement( 'tr', {},
				wp.element.createElement( 'td', {}, 'Title' ),
			),
		),
		wp.element.createElement( 'tbody', {},
			pages?.map( page => (
				wp.element.createElement( 'tr', { key: page.id },
					wp.element.createElement( 'td', {}, page.title.rendered ),
				)
			) ),
		),
	);
}
```

</details>

All that’s left is to refresh the page and enjoy the brand new status indicator:

![](./media/list-of-pages/indicator.jpg)
![](./media/list-of-pages/no-results.jpg)

## What's next?

* Review the [full example](./media/list-of-pages/first-gutenberg-app)
* **Previous part:** [Setup](./1-setup.md)
* **Next part:** Adding an „Edit page” feature (coming soon)
