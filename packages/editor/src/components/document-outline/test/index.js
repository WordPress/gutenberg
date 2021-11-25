/**
 * External dependencies
 */
import { mount, shallow } from 'enzyme';

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
			const wrapper = shallow( <DocumentOutline /> );

			expect( wrapper.html() ).toBe( null );
		} );

		it( 'should not render when no heading blocks provided', () => {
			const blocks = [ paragraph ].map( ( block, index ) => {
				// Set client IDs to a predictable value.
				return { ...block, clientId: `clientId_${ index }` };
			} );
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper.html() ).toBe( null );
		} );
	} );

	describe( 'header blocks present', () => {
		it( 'should match snapshot', () => {
			const blocks = [ headingH2, headingH3 ].map( ( block, index ) => {
				// Set client IDs to a predictable value.
				return { ...block, clientId: `clientId_${ index }` };
			} );
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should render an item when only one heading provided', () => {
			const blocks = [ headingH2 ];
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper.find( 'TableOfContentsItem' ) ).toHaveLength( 1 );
		} );

		it( 'should render two items when two headings and some paragraphs provided', () => {
			const blocks = [
				paragraph,
				headingH2,
				paragraph,
				headingH3,
				paragraph,
			];
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper.find( 'TableOfContentsItem' ) ).toHaveLength( 2 );
		} );

		it( 'should render warnings for multiple h1 headings', () => {
			const blocks = [ headingH1, paragraph, headingH1, paragraph ].map(
				( block, index ) => {
					// Set client IDs to a predictable value.
					return { ...block, clientId: `clientId_${ index }` };
				}
			);
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper ).toMatchSnapshot();
		} );
	} );

	describe( 'nested headings', () => {
		it( 'should render even if the heading is nested', () => {
			const tableOfContentItemsSelector = 'TableOfContentsItem';
			const outlineLevelsSelector = '.document-outline__level';
			const outlineItemContentSelector =
				'.document-outline__item-content';

			const blocks = [ headingH2, nestedHeading ];
			const wrapper = mount( <DocumentOutline blocks={ blocks } /> );

			// Unnested heading and nested heading should appear as items.
			const tableOfContentItems = wrapper.find(
				tableOfContentItemsSelector
			);
			expect( tableOfContentItems ).toHaveLength( 2 );

			// Unnested heading test.
			const firstItemLevels = tableOfContentItems
				.at( 0 )
				.find( outlineLevelsSelector );
			expect( firstItemLevels ).toHaveLength( 1 );
			expect( firstItemLevels.at( 0 ).text() ).toEqual( 'H2' );
			expect(
				tableOfContentItems
					.at( 0 )
					.find( outlineItemContentSelector )
					.text()
			).toEqual( 'Heading 2' );

			// Nested heading test.
			const secondItemLevels = tableOfContentItems
				.at( 1 )
				.find( outlineLevelsSelector );
			expect( secondItemLevels ).toHaveLength( 1 );
			expect( secondItemLevels.at( 0 ).text() ).toEqual( 'H3' );
			expect(
				tableOfContentItems
					.at( 1 )
					.find( outlineItemContentSelector )
					.text()
			).toEqual( 'Heading 3' );
		} );
	} );
} );
