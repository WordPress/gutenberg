import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostExcerptEditor from '../edit';

vi.mock( import( '@wordpress/core-data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useEntityProp: () => [ '', vi.fn(), {} ],
} ) );

vi.mock( import( '../../utils/hooks' ), () => ( {
	useCanEditEntity: () => false,
	useToolsPanelDropdownMenuProps: () => ( {} ),
} ) );

vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	InspectorControls: ( { children } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
	RichText: ( { placeholder, value, className } ) => (
		<span
			className={ className }
			data-testid="rich-text"
			placeholder={ placeholder }
		>
			{ value }
		</span>
	),
	Warning: ( { children } ) => <div>{ children }</div>,
	useBlockProps: () => ( { className: 'wp-block-post-excerpt' } ),
} ) );

vi.mock( import( '@wordpress/components' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	ToggleControl: ( { label } ) => <div>{ label }</div>,
	RangeControl: ( { label } ) => <div>{ label }</div>,
	__experimentalToolsPanel: ( { children } ) => <div>{ children }</div>,
	__experimentalToolsPanelItem: ( { children } ) => <div>{ children }</div>,
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		useSelect: ( callback ) =>
			callback( () => ( {
				getPostType: () => ( { supports: { excerpt: true } } ),
			} ) ),
		useDispatch: () => ( {
			__unstableMarkNextChangeAsNotPersistent: vi.fn(),
		} ),
	};
} );

describe( 'PostExcerptEditor', () => {
	it( 'renders placeholder text, read more link, and inspector controls when postType and postId are not present', () => {
		const props = {
			attributes: {
				moreText: '',
				showMoreOnNewLine: true,
				excerptLength: 55,
			},
			setAttributes: vi.fn(),
			isSelected: false,
			context: {},
		};

		render( <PostExcerptEditor { ...props } /> );

		expect(
			screen.getByText( 'This block will display the excerpt.' )
		).toBeInTheDocument();

		const readMore = screen.getByTestId( 'rich-text' );
		expect( readMore ).toHaveAttribute(
			'placeholder',
			'Add "read more" link text'
		);

		expect(
			screen.getByTestId( 'inspector-controls' )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Show link on new line' )
		).toBeInTheDocument();
		expect( screen.getByText( 'Max number of words' ) ).toBeInTheDocument();
	} );
} );
