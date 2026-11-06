import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';

// The block library's type projects leave out its JavaScript files, so the
// component is loaded by path, which TypeScript does not follow.
const { default: PostExcerptEditor } = await vi.importActual< {
	default: ComponentType< {
		attributes: {
			moreText: string;
			showMoreOnNewLine: boolean;
			excerptLength: number;
		};
		setAttributes: ( attributes: object ) => void;
		isSelected: boolean;
		context: {
			postId?: number;
			postType?: string;
			queryId?: number;
		};
	} >;
} >( '../edit' );

// The mocks stand in only for what the block renders, not for the whole modules.
vi.mock( import( '@wordpress/core-data' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		useEntityProp: () => [ '', vi.fn(), {} ],
	} as never;
} );

vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		InspectorControls: ( { children }: { children?: ReactNode } ) => (
			<div data-testid="inspector-controls">{ children }</div>
		),
		RichText: ( {
			placeholder,
			value,
			className,
		}: {
			placeholder?: string;
			value?: string;
			className?: string;
		} ) => (
			<span
				className={ className }
				data-testid="rich-text"
				data-placeholder={ placeholder }
			>
				{ value }
			</span>
		),
		Warning: ( { children }: { children?: ReactNode } ) => (
			<div>{ children }</div>
		),
		useBlockProps: () => ( { className: 'wp-block-post-excerpt' } ),
	} as never;
} );

vi.mock( import( '@wordpress/components' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		ToggleControl: ( { label }: { label?: ReactNode } ) => (
			<div>{ label }</div>
		),
		RangeControl: ( { label }: { label?: ReactNode } ) => (
			<div>{ label }</div>
		),
		__experimentalToolsPanel: ( {
			children,
		}: {
			children?: ReactNode;
		} ) => <div>{ children }</div>,
		__experimentalToolsPanelItem: ( {
			children,
		}: {
			children?: ReactNode;
		} ) => <div>{ children }</div>,
	} as never;
} );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		useSelect: ( callback: ( select: () => object ) => unknown ) =>
			callback( () => ( {
				canUser: () => false,
				getPostType: () => ( { supports: { excerpt: true } } ),
			} ) ),
		useDispatch: () => ( {
			__unstableMarkNextChangeAsNotPersistent: vi.fn(),
		} ),
	} as never;
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
			'data-placeholder',
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
