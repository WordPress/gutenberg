/**
 * External dependencies
 */
import { fn } from '@storybook/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	__experimentalLinkControlV2,
	useLinkControlV2,
	createDefaultSearchHandler,
	createTypedSearchHandler,
} from '../';

/**
 * Mock fetchSuggestions function for Storybook.
 * Returns mock suggestions based on search query.
 */
const mockFetchSuggestions = async ( search, options = {} ) => {
	// Simulate network delay
	await new Promise( ( resolve ) => setTimeout( resolve, 300 ) );

	const { isInitialSuggestions = false, type } = options;

	// Initial suggestions (when no search query)
	if ( isInitialSuggestions || ! search ) {
		const suggestions = [
			{
				id: 1,
				title: 'Sample Page',
				url: 'https://example.com/sample-page',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'About Us',
				url: 'https://example.com/about',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 3,
				title: 'Contact',
				url: 'https://example.com/contact',
				type: 'page',
				kind: 'post-type',
			},
		];

		// Filter by type if specified
		if ( type ) {
			return suggestions.filter( ( s ) => s.type === type );
		}

		return suggestions;
	}

	// Filter suggestions based on search query
	const allSuggestions = [
		{
			id: 1,
			title: 'Sample Page',
			url: 'https://example.com/sample-page',
			type: 'page',
			kind: 'post-type',
		},
		{
			id: 2,
			title: 'About Us',
			url: 'https://example.com/about',
			type: 'page',
			kind: 'post-type',
		},
		{
			id: 3,
			title: 'Contact',
			url: 'https://example.com/contact',
			type: 'page',
			kind: 'post-type',
		},
		{
			id: 4,
			title: 'Blog Post',
			url: 'https://example.com/blog-post',
			type: 'post',
			kind: 'post-type',
		},
		{
			id: 5,
			title: 'Category: News',
			url: 'https://example.com/category/news',
			type: 'category',
			kind: 'taxonomy',
		},
	];

	const searchLower = search.toLowerCase();
	const filtered = allSuggestions.filter(
		( suggestion ) =>
			suggestion.title.toLowerCase().includes( searchLower ) ||
			suggestion.url.toLowerCase().includes( searchLower )
	);

	// Filter by type if specified
	if ( type ) {
		return filtered.filter( ( s ) => s.type === type );
	}

	return filtered;
};

const meta = {
	title: 'BlockEditor/LinkControlV2',
	component: __experimentalLinkControlV2,
	tags: [ 'status-experimental' ],
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'LinkControlV2 is a compound component that provides a flexible API for managing link values with opinionated defaults. It uses search handlers for flexible search functionality.',
			},
		},
	},
	argTypes: {
		value: {
			control: { type: 'object' },
			description:
				'The committed link value (what has been saved/applied).',
			table: {
				type: { summary: 'LinkValue' },
			},
		},
		onChange: {
			action: 'onChange',
			description: 'Callback when the committed value changes.',
			table: {
				type: { summary: 'function' },
			},
		},
		settings: {
			control: { type: 'object' },
			description: 'Link settings configuration.',
			table: {
				type: { summary: 'LinkSetting[]' },
			},
		},
		searchHandler: {
			control: { type: null },
			description:
				'Search handler function that determines what happens when a search is made.',
			table: {
				type: { summary: 'HandleSearch' },
			},
		},
	},
};

export default meta;

/**
 * Default story with basic usage.
 */
export const Default = {
	render: function Template( { onChange, searchHandler, ...args } ) {
		const [ value, setValue ] = useState( args.value );

		// Create default handler with fetch function if not provided
		const handler =
			searchHandler || createDefaultSearchHandler( mockFetchSuggestions );

		return (
			<div style={ { maxWidth: '400px', padding: '20px' } }>
				<__experimentalLinkControlV2
					{ ...args }
					value={ value }
					onChange={ ( newValue ) => {
						setValue( newValue );
						onChange( newValue );
					} }
					searchHandler={ handler }
				/>
			</div>
		);
	},
	args: {
		value: undefined,
		onChange: fn(),
		searchHandler: createDefaultSearchHandler( mockFetchSuggestions ),
	},
};

/**
 * Story with an existing link value.
 */
export const WithValue = {
	render: function Template( { onChange, searchHandler, ...args } ) {
		const [ value, setValue ] = useState( args.value );

		// Create default handler with fetch function if not provided
		const handler =
			searchHandler || createDefaultSearchHandler( mockFetchSuggestions );

		return (
			<div style={ { maxWidth: '400px', padding: '20px' } }>
				<__experimentalLinkControlV2
					{ ...args }
					value={ value }
					onChange={ ( newValue ) => {
						setValue( newValue );
						onChange( newValue );
					} }
					searchHandler={ handler }
				/>
			</div>
		);
	},
	args: {
		value: {
			url: 'https://example.com/sample-page',
			title: 'Sample Page',
		},
		onChange: fn(),
		searchHandler: createDefaultSearchHandler( mockFetchSuggestions ),
	},
};

/**
 * Story demonstrating disabling the TitleInput component using the components prop.
 * Shows how to pass false to disable a component while keeping the default composition.
 */
export const DisablingTitleField = {
	render: function Template( { onChange, searchHandler, ...args } ) {
		const [ value, setValue ] = useState( args.value );

		// Create default handler with fetch function if not provided
		const handler =
			searchHandler || createDefaultSearchHandler( mockFetchSuggestions );

		return (
			<div style={ { maxWidth: '400px', padding: '20px' } }>
				<__experimentalLinkControlV2
					{ ...args }
					value={ value }
					onChange={ ( newValue ) => {
						setValue( newValue );
						onChange( newValue );
					} }
					searchHandler={ handler }
					components={ {
						TitleInput: false,
					} }
				/>
			</div>
		);
	},
	args: {
		value: {
			url: 'https://example.com/sample-page',
			title: 'Sample Page',
			label: 'Custom Label',
		},
		onChange: fn(),
		searchHandler: createDefaultSearchHandler( mockFetchSuggestions ),
	},
};

/**
 * Story with custom composition using children and context.
 * Demonstrates using useLinkControlV2 hook to conditionally show/hide components.
 */
export const CustomComposition = {
	render: function Template( { onChange, searchHandler, ...args } ) {
		const [ value, setValue ] = useState( args.value );

		// Create default handler with fetch function if not provided
		const handler =
			searchHandler || createDefaultSearchHandler( mockFetchSuggestions );

		return (
			<div style={ { maxWidth: '400px', padding: '20px' } }>
				<__experimentalLinkControlV2
					{ ...args }
					value={ value }
					onChange={ ( newValue ) => {
						setValue( newValue );
						onChange( newValue );
					} }
					searchHandler={ handler }
				>
					<CustomCompositionExample />
				</__experimentalLinkControlV2>
			</div>
		);
	},
	args: {
		value: {
			url: 'https://example.com/sample-page',
			title: 'Sample Page',
			label: 'Custom Label',
		},
		onChange: fn(),
		searchHandler: createDefaultSearchHandler( mockFetchSuggestions ),
	},
};

/**
 * Example component demonstrating custom composition with context-based conditional rendering.
 */
function CustomCompositionExample() {
	const { isEditing, value, uncommittedValue } = useLinkControlV2();

	// Use context to conditionally render components
	if ( isEditing ) {
		return (
			<>
				<__experimentalLinkControlV2.SearchInput />
				<div
					style={ {
						padding: '10px',
						background: '#f0f0f0',
						margin: '10px 0',
					} }
				>
					<p>
						<strong>Custom content</strong> - Only shown when
						editing
					</p>
					<p>Uncommitted URL: { uncommittedValue?.url || 'None' }</p>
				</div>
				<__experimentalLinkControlV2.TitleInput />
				<__experimentalLinkControlV2.Settings />
				<__experimentalLinkControlV2.Actions />
			</>
		);
	}

	// Show preview when not editing and there's a committed value
	if ( value ) {
		return (
			<>
				<__experimentalLinkControlV2.Preview />
				<div
					style={ {
						padding: '10px',
						background: '#e8f5e9',
						margin: '10px 0',
					} }
				>
					<p>
						<strong>Custom preview info</strong> - Only shown when
						not editing
					</p>
					<p>Committed URL: { value?.url || 'None' }</p>
				</div>
			</>
		);
	}

	return null;
}

/**
 * Story demonstrating the useLinkControlV2 hook.
 */
export const WithHook = {
	render: function Template( { onChange, searchHandler, ...args } ) {
		const [ value, setValue ] = useState( args.value );

		// Create default handler with fetch function if not provided
		const handler =
			searchHandler || createDefaultSearchHandler( mockFetchSuggestions );

		return (
			<div style={ { maxWidth: '400px', padding: '20px' } }>
				<__experimentalLinkControlV2
					{ ...args }
					value={ value }
					onChange={ ( newValue ) => {
						setValue( newValue );
						onChange( newValue );
					} }
					searchHandler={ handler }
				>
					<HookExample />
				</__experimentalLinkControlV2>
			</div>
		);
	},
	args: {
		value: undefined,
		onChange: fn(),
		searchHandler: createDefaultSearchHandler( mockFetchSuggestions ),
	},
};

/**
 * Example component demonstrating useLinkControlV2 hook usage with conditional rendering.
 */
function HookExample() {
	const { value, uncommittedValue, isEditing } = useLinkControlV2();

	// Use context to conditionally render based on editing state
	if ( isEditing ) {
		return (
			<div>
				<__experimentalLinkControlV2.SearchInput />
				<div
					style={ {
						marginTop: '10px',
						padding: '10px',
						background: '#f9f9f9',
					} }
				>
					<p>
						<strong>Committed:</strong> { value?.url || 'None' }
					</p>
					<p>
						<strong>Uncommitted:</strong>{ ' ' }
						{ uncommittedValue?.url || 'None' }
					</p>
					<p>
						<strong>Editing:</strong> { isEditing ? 'Yes' : 'No' }
					</p>
				</div>
				<__experimentalLinkControlV2.Actions />
			</div>
		);
	}

	// Show preview when not editing
	if ( value ) {
		return (
			<>
				<__experimentalLinkControlV2.Preview />
				<div
					style={ {
						marginTop: '10px',
						padding: '10px',
						background: '#e3f2fd',
					} }
				>
					<p>
						<strong>Preview Mode</strong> - Not editing
					</p>
					<p>Committed URL: { value?.url || 'None' }</p>
				</div>
			</>
		);
	}

	return null;
}

/**
 * Story demonstrating typed search handler for specific post types.
 * Shows how Nav block "Product link" variation would work.
 */
export const TypedSearchHandler = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState( args.value );

		// Create typed handler for products (like Nav block "Product link" variation)
		const productHandler = createTypedSearchHandler( mockFetchSuggestions, {
			type: 'product',
		} );

		return (
			<div style={ { maxWidth: '400px', padding: '20px' } }>
				<__experimentalLinkControlV2
					{ ...args }
					value={ value }
					onChange={ ( newValue ) => {
						setValue( newValue );
						onChange( newValue );
					} }
					searchHandler={ productHandler }
				/>
			</div>
		);
	},
	args: {
		value: undefined,
		onChange: fn(),
	},
};
