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
	let paragraph, headingH1, headingParent, headingChild, nestedHeading;
	beforeAll( () => {
		registerBlockType( 'core/heading', {
			category: 'common',
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
			category: 'common',
			title: 'Paragraph',
			edit: () => {},
			save: () => {},
		} );

		registerBlockType( 'core/columns', {
			category: 'common',
			title: 'Paragraph',
			edit: () => {},
			save: () => {},
		} );

		paragraph = createBlock( 'core/paragraph' );
		headingH1 = createBlock( 'core/heading', {
			content: 'Heading 1',
			level: 1,
		} );
		headingParent = createBlock( 'core/heading', {
			content: 'Heading parent',
			level: 2,
		} );
		headingChild = createBlock( 'core/heading', {
			content: 'Heading child',
			level: 3,
		} );

		nestedHeading = createBlock( 'core/columns', undefined, [
			headingChild,
		] );
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
			const blocks = [ headingParent, headingChild ].map(
				( block, index ) => {
					// Set client IDs to a predictable value.
					return { ...block, clientId: `clientId_${ index }` };
				}
			);
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should render an item when only one heading provided', () => {
			const blocks = [ headingParent ];
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper.find( 'TableOfContentsItem' ) ).toHaveLength( 1 );
		} );

		it( 'should render two items when two headings and some paragraphs provided', () => {
			const blocks = [
				paragraph,
				headingParent,
				paragraph,
				headingChild,
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

			const blocks = [ headingParent, nestedHeading ];
			const wrapper = mount( <DocumentOutline blocks={ blocks } /> );

			//heading parent and nested heading should appear as items
			const tableOfContentItems = wrapper.find(
				tableOfContentItemsSelector
			);
			expect( tableOfContentItems ).toHaveLength( 2 );

			//heading parent test
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
			).toEqual( 'Heading parent' );

			//nested heading test
			const secondItemLevels = tableOfContentItems
				.at( 1 )
				.find( outlineLevelsSelector );
			expect( secondItemLevels ).toHaveLength( 2 );
			expect( secondItemLevels.at( 0 ).text() ).toEqual( 'Block Title' );
			expect( secondItemLevels.at( 1 ).text() ).toEqual( 'H3' );
			expect(
				tableOfContentItems
					.at( 1 )
					.find( outlineItemContentSelector )
					.text()
			).toEqual( 'Heading child' );
		} );
	} );
} );
