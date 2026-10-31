import { render, screen } from '@testing-library/react';
import { useBlockProps } from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import PostTitleEdit from '../edit';

// Fully mock the WordPress data/editor packages the component (and its shared
// hooks) touch. Only the pieces actually used are provided; `PlainText` is
// replaced with a simple input so its `placeholder` prop is queryable.
jest.mock( '@wordpress/block-editor', () => ( {
	store: {},
	useBlockProps: jest.fn( () => ( {} ) ),
	useBlockEditingMode: jest.fn( () => 'disabled' ),
	BlockControls: () => null,
	InspectorControls: () => null,
	HeadingLevelDropdown: () => null,
	PlainText: ( { placeholder, value } ) => (
		<input readOnly placeholder={ placeholder } value={ value } />
	),
} ) );

// The settings UI (ToolsPanel etc.) lives in the un-rendered InspectorControls
// branch; stub it out so the test does not pull in the full components package.
jest.mock( '@wordpress/components', () => ( {
	ToggleControl: () => null,
	TextControl: () => null,
	ExternalLink: () => null,
	__experimentalToolsPanel: () => null,
	__experimentalToolsPanelItem: () => null,
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
	useEntityProp: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

const defaultProps = {
	attributes: {
		level: 2,
		levelOptions: undefined,
		isLink: false,
		rel: '',
		linkTarget: '_self',
		placeholder: undefined,
	},
	setAttributes: jest.fn(),
	context: { postType: 'post', postId: 1, queryId: undefined },
};

/**
 * Points `useEntityProp` at a given title. It is called twice by the
 * component: once for `title` and once for `link`.
 *
 * @param {string} title The raw post title.
 */
function mockEntity( title = '' ) {
	useEntityProp.mockImplementation( ( kind, name, prop ) => {
		if ( prop === 'title' ) {
			return [ title, jest.fn(), { rendered: title } ];
		}
		// `link`
		return [ 'https://example.com' ];
	} );
}

describe( 'PostTitleEdit', () => {
	beforeEach( () => {
		useBlockProps.mockImplementation( () => ( {} ) );
		// The user can edit the entity (enables the editable PlainText path).
		useSelect.mockReturnValue( true );
		mockEntity( '' );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'uses a custom placeholder when one is set', () => {
		render(
			<PostTitleEdit
				{ ...defaultProps }
				attributes={ {
					...defaultProps.attributes,
					placeholder: 'Add a headline',
				} }
			/>
		);

		expect(
			screen.getByPlaceholderText( 'Add a headline' )
		).toBeInTheDocument();
	} );

	test( 'falls back to the default placeholder when none is set', () => {
		render( <PostTitleEdit { ...defaultProps } /> );

		expect(
			screen.getByPlaceholderText( '(no title)' )
		).toBeInTheDocument();
	} );

	test( 'uses a custom placeholder on the linked title when a title exists', () => {
		mockEntity( 'An existing title' );
		render(
			<PostTitleEdit
				{ ...defaultProps }
				attributes={ {
					...defaultProps.attributes,
					isLink: true,
					placeholder: 'Add a headline',
				} }
			/>
		);

		expect(
			screen.getByPlaceholderText( 'Add a headline' )
		).toBeInTheDocument();
	} );

	test( 'falls back to the default placeholder on an empty linked title', () => {
		render(
			<PostTitleEdit
				{ ...defaultProps }
				attributes={ {
					...defaultProps.attributes,
					isLink: true,
					placeholder: 'Add a headline',
				} }
			/>
		);

		expect(
			screen.getByPlaceholderText( '(no title)' )
		).toBeInTheDocument();
	} );
} );
