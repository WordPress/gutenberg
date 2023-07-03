/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { DocumentOutline } from '../';

jest.mock( '@wordpress/block-editor', () => ( {
	BlockTitle: () => 'Block Title',
} ) );

describe( 'DocumentOutline', () => {
	let paragraph, headingH1, headingH2, headingH3, nestedHeading;
	beforeAll( () => {
		registerBlockType( 'core/heading', {
			category: 'text',
			title: 'Heading',
			edit: () => {},
			save: () => {},
			attributes: {
				level: {
					type: 'number',
					default: 2,
				},
				content: {
					type: 'string',
				},
			},
		} );

		registerBlockType( 'core/paragraph', {
			category: 'text',
			title: 'Paragraph',
			edit: () => {},
			save: () => {},
		} );

		registerBlockType( 'core/columns', {
			category: 'text',
			title: 'Paragraph',
			edit: () => {},
			save: () => {},
		} );

		paragraph = createBlock( 'core/paragraph' );
		headingH1 = createBlock( 'core/heading', {
			content: 'Heading 1',
			level: 1,
		} );
		headingH2 = createBlock( 'core/heading', {
			content: 'Heading 2',
			level: 2,
		} );
		headingH3 = createBlock( 'core/heading', {
			content: 'Heading 3',
			level: 3,
		} );
		nestedHeading = createBlock( 'core/columns', undefined, [ headingH3 ] );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/heading' );
		unregisterBlockType( 'core/paragraph' );
	} );

	describe( 'no header blocks present', () => {
		it( 'should not render when no blocks provided', () => {
			render( <DocumentOutline /> );

			expect( screen.queryByRole( 'list' ) ).not.toBeInTheDocument();
		} );

		it( 'should not render when no heading blocks provided', () => {
			const blocks = [ paragraph ].map( ( block, index ) => {
				// Set client IDs to a predictable value.
				return { ...block, clientId: `clientId_${ index }` };
			} );
			render( <DocumentOutline blocks={ blocks } /> );

			expect( screen.queryByRole( 'list' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'header blocks present', () => {
		it( 'should match snapshot', () => {
			const blocks = [ headingH2, headingH3 ].map( ( block, index ) => {
				// Set client IDs to a predictable value.
				return { ...block, clientId: `clientId_${ index }` };
			} );
			render( <DocumentOutline blocks={ blocks } /> );

			expect( screen.getByRole( 'list' ) ).toMatchSnapshot();
		} );

		it( 'should render an item when only one heading provided', () => {
			const blocks = [ headingH2 ];
			render( <DocumentOutline blocks={ blocks } /> );

			const tableOfContentItem = within(
				screen.getByRole( 'list' )
			).getByRole( 'listitem' );
			expect( tableOfContentItem ).toBeInTheDocument();
			expect( tableOfContentItem ).toHaveTextContent( 'Heading 2' );
		} );

		it( 'should render two items when two headings and some paragraphs provided', () => {
			const blocks = [
				paragraph,
				headingH2,
				paragraph,
				headingH3,
				paragraph,
			];
			render( <DocumentOutline blocks={ blocks } /> );

			expect(
				within( screen.getByRole( 'list' ) ).getAllByRole( 'listitem' )
			).toHaveLength( 2 );
		} );

		it( 'should render warnings for multiple h1 headings', () => {
			const blocks = [ headingH1, paragraph, headingH1, paragraph ].map(
				( block, index ) => {
					// Set client IDs to a predictable value.
					return { ...block, clientId: `clientId_${ index }` };
				}
			);
			render( <DocumentOutline blocks={ blocks } /> );

			expect( screen.getByRole( 'list' ) ).toMatchSnapshot();
		} );
	} );

	describe( 'nested headings', () => {
		it( 'should render even if the heading is nested', () => {
			const blocks = [ headingH2, nestedHeading ];
			render( <DocumentOutline blocks={ blocks } /> );

			// Unnested heading and nested heading should appear as items.
			const tableOfContentItems = within(
				screen.getByRole( 'list' )
			).getAllByRole( 'listitem' );
			expect( tableOfContentItems ).toHaveLength( 2 );

			// Unnested heading test.
			expect( tableOfContentItems[ 0 ] ).toHaveTextContent( 'H2' );
			expect( tableOfContentItems[ 0 ] ).toHaveTextContent( 'Heading 2' );

			// Nested heading test.
			expect( tableOfContentItems[ 1 ] ).toHaveTextContent( 'H3' );
			expect( tableOfContentItems[ 1 ] ).toHaveTextContent( 'Heading 3' );
		} );
	} );
} );
