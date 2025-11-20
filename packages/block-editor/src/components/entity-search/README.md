# EntitySearch

`EntitySearch` is a searchable combobox component for selecting entities from the WordPress site, including posts, pages, custom post types, taxonomies, and more.

## Usage

### Basic Usage

```jsx
import { EntitySearch } from '@wordpress/block-editor';

function MyComponent() {
	const [ url, setUrl ] = useState( '' );

	return (
		<EntitySearch
			label="Select a link"
			value={ url }
			onChange={ ( newUrl ) => setUrl( newUrl ) }
		/>
	);
}
```

### Customizing Display Value

By default, the URL is shown in the input field. You can customize this with `getDisplayValue`:

```jsx
// Show title in the input field instead of URL
<EntitySearch
	label="Select a link"
	value={ url }
	onChange={ setUrl }
	getDisplayValue={ ( suggestion ) => suggestion.title }
/>

// Show a custom format
<EntitySearch
	label="Select a link"
	value={ url }
	onChange={ setUrl }
	getDisplayValue={ ( suggestion ) =>
		`${ suggestion.title } (${ suggestion.type })`
	}
/>

// Default behavior - shows URL
<EntitySearch
	label="Select a link"
	value={ url }
	onChange={ setUrl }
/>
```

### Filtering by Entity Type

```jsx
// Search only pages
<EntitySearch
	label="Select a page"
	value={ url }
	onChange={ setUrl }
	suggestionsQuery={ { type: 'post', subtype: 'page' } }
/>

// Search only categories
<EntitySearch
	label="Select a category"
	value={ url }
	onChange={ setUrl }
	suggestionsQuery={ { type: 'term', subtype: 'category' } }
/>

// Search only posts
<EntitySearch
	label="Select a post"
	value={ url }
	onChange={ setUrl }
	suggestionsQuery={ { type: 'post', subtype: 'post' } }
/>

// Search all posts (any post type)
<EntitySearch
	label="Select any post"
	value={ url }
	onChange={ setUrl }
	suggestionsQuery={ { type: 'post' } }
/>

// Search all taxonomies
<EntitySearch
	label="Select a term"
	value={ url }
	onChange={ setUrl }
	suggestionsQuery={ { type: 'term' } }
/>
```

## Props

### label

The label for the control.

-   Type: `String`
-   Required: Yes

### value

The current selected URL value.

-   Type: `String`
-   Required: No

### onChange

Callback function invoked when the user selects an entity. Receives the entity's URL as the argument.

-   Type: `Function`
-   Required: Yes

### help

Optional help text displayed below the control.

-   Type: `String`
-   Required: No

### getDisplayValue

Function to determine what text is displayed in the input field when an entity is selected.

-   Type: `Function`
-   Required: No
-   Default: `( suggestion ) => suggestion.url`

The function receives a suggestion object with properties:
-   `title`: The entity title
-   `url`: The entity URL
-   `type`: The entity type (e.g., 'post', 'page', 'category')
-   `kind`: The entity kind (e.g., 'post-type', 'taxonomy')
-   `id`: The entity ID

#### Examples:

```js
// Show URL (default)
getDisplayValue={ ( suggestion ) => suggestion.url }

// Show title
getDisplayValue={ ( suggestion ) => suggestion.title }

// Show custom format
getDisplayValue={ ( suggestion ) => `${ suggestion.title } - ${ suggestion.url }` }
```

### suggestionsQuery

Query parameters to filter the search results by entity type.

-   Type: `Object`
-   Required: No
-   Default: `{}`

#### Supported properties:

-   `type`: Filter by entity type
    -   `'post'` - All post types (posts, pages, custom post types)
    -   `'term'` - All taxonomies (categories, tags, custom taxonomies)
    -   `'attachment'` - Media attachments
    -   `'post-format'` - Post formats
-   `subtype`: Filter by specific post type or taxonomy slug
    -   For posts: `'post'`, `'page'`, or any custom post type slug
    -   For terms: `'category'`, `'post_tag'`, or any custom taxonomy slug

#### Examples:

```js
// Only pages
suggestionsQuery={ { type: 'post', subtype: 'page' } }

// Only categories
suggestionsQuery={ { type: 'term', subtype: 'category' } }

// All posts (any post type)
suggestionsQuery={ { type: 'post' } }

// All taxonomies
suggestionsQuery={ { type: 'term' } }
```

## Features

-   **Multi-type search**: Searches across all post types (including custom), taxonomies, attachments, and post formats
-   **Filterable**: Optionally filter results to specific entity types using `suggestionsQuery`
-   **Debounced search**: Search input is debounced (300ms) to reduce API calls
-   **Initial suggestions**: Shows relevant suggestions when the field is first focused
-   **Custom formatting**: Each result displays:
    -   Entity icon (on the left)
    -   Entity title
    -   Entity type label (Post, Page, Category, etc.)
    -   Shortened URL
-   **Loading states**: Shows a loading indicator while fetching results

## Technical Details

This component uses the `__experimentalFetchLinkSuggestions` function from the block editor settings, which queries the `/wp/v2/search` endpoint to search across all entity types in a single request.

The component follows the same patterns as the `LinkControl` component but provides a simpler combobox-based interface suitable for single-field entity selection scenarios.
