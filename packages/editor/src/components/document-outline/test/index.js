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
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DocumentOutline from '../';

function mockUseSelect( blocks ) {
	useSelect.mockImplementation( ( cb ) => {
		return cb( () => ( {
			getBlocks: () => blocks,
			getEditedPostAttribute( attr ) {
				if ( attr === 'type' ) {
					return 'post';
				} else if ( attr === 'title' ) {
					return 'Mocked post title';
				}
				return undefined;
			},
			getPostType: () => ( { supports: { title: true } } ),
		} ) );
	} );
}

jest.mock( '@wordpress/block-editor', () => ( {
	BlockTitle: () => 'Block Title',
} ) );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test
	const mock = jest.fn();
	return mock;
} );

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

		registerBlockType( 'core/group', {
			category: 'design',
			title: 'Group',
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
		nestedHeading = createBlock( 'core/group', undefined, [ headingH3 ] );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/heading' );
		unregisterBlockType( 'core/paragraph' );
	} );

	describe( 'no header blocks present', () => {
		it( 'should not render when no blocks provided', () => {
			mockUseSelect( [] );
			const wrapper = shallow( <DocumentOutline /> );

			expect( wrapper.html() ).toBe( null );
		} );

		it( 'should not render when no heading blocks provided', () => {
			const blocks = [ paragraph ].map( ( block, index ) => {
				// Set client IDs to a predictable value.
				return { ...block, clientId: `clientId_${ index }` };
			} );
			mockUseSelect( blocks );
			const wrapper = shallow( <DocumentOutline /> );

			expect( wrapper.html() ).toBe( null );
		} );
	} );

	describe( 'header blocks present', () => {
		it( 'should match snapshot', () => {
			const blocks = [ headingH2, headingH3 ].map( ( block, index ) => {
				// Set client IDs to a predictable value.
				return { ...block, clientId: `clientId_${ index }` };
			} );
			mockUseSelect( blocks );
			const wrapper = shallow( <DocumentOutline /> );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should render an item when only one heading provided', () => {
			const blocks = [ headingH2 ];
			mockUseSelect( blocks );
			const wrapper = shallow( <DocumentOutline /> );

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
			mockUseSelect( blocks );
			const wrapper = shallow( <DocumentOutline /> );

			expect( wrapper.find( 'TableOfContentsItem' ) ).toHaveLength( 2 );
		} );

		it( 'should render warnings for multiple h1 headings', () => {
			const blocks = [ headingH1, paragraph, headingH1, paragraph ].map(
				( block, index ) => {
					// Set client IDs to a predictable value.
					return { ...block, clientId: `clientId_${ index }` };
				}
			);
			mockUseSelect( blocks );
			const wrapper = shallow( <DocumentOutline /> );

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
			mockUseSelect( blocks );
			const wrapper = mount( <DocumentOutline /> );

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
