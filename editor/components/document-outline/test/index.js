/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { createBlock, registerCoreBlocks } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { DocumentOutline } from '../';

describe( 'DocumentOutline', () => {
	registerCoreBlocks();

	const paragraph = createBlock( 'core/paragraph' );
	const headingH1 = createBlock( 'core/heading', {
		content: 'Heading 1',
		nodeName: 'H1',
	} );
	const headingParent = createBlock( 'core/heading', {
		content: 'Heading parent',
		nodeName: 'H2',
	} );
	const headingChild = createBlock( 'core/heading', {
		content: 'Heading child',
		nodeName: 'H3',
	} );

	describe( 'no header blocks present', () => {
		it( 'should not render when no blocks provided', () => {
			const wrapper = shallow( <DocumentOutline /> );

			expect( wrapper.html() ).toBe( null );
		} );

		it( 'should not render when no heading blocks provided', () => {
			const blocks = [ paragraph ];
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper.html() ).toBe( null );
		} );
	} );

	describe( 'header blocks present', () => {
		it( 'should match snapshot', () => {
			const blocks = [ headingParent, headingChild ];
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should render an item when only one heading provided', () => {
			const blocks = [ headingParent ];
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper.find( 'TableOfContentsItem' ) ).toHaveLength( 1 );
		} );

		it( 'should render two items when two headings and some paragraphs provided', () => {
			const blocks = [ paragraph, headingParent, paragraph, headingChild, paragraph ];
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper.find( 'TableOfContentsItem' ) ).toHaveLength( 2 );
		} );

		it( 'should render warnings for multiple h1 headings', () => {
			const blocks = [ headingH1, paragraph, headingH1, paragraph ];
			const wrapper = shallow( <DocumentOutline blocks={ blocks } /> );

			expect( wrapper ).toMatchSnapshot();
		} );
	} );
} );
