/**
 * External dependencies
 */
import { noop } from 'lodash';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockSettingsMenuContent } from '../content';

describe( 'BlockSettingsMenuContent', () => {
	const handlers = {
		onDelete: noop, onToggleSidebar: noop, onShowInspector: noop, onToggleMode: noop, onClose: noop,
	};

	it( 'should not render the HTML mode button on multiselection', () => {
		const wrapper = shallow( <BlockSettingsMenuContent uids={ [ 1, 2 ] } { ...handlers } /> );
		const buttons = wrapper.find( 'IconButton' ).map( ( button ) => button.prop( 'children' ) );

		expect( buttons ).toEqual( [ 'Settings', 'Delete' ] );
	} );

	it( 'should not render the HTML mode button if the block doesn\'t support it', () => {
		const wrapper = shallow(
			<BlockSettingsMenuContent uids={ [ 1 ] } blockType={ { supportHTML: false } } { ...handlers } />
		);
		const buttons = wrapper.find( 'IconButton' ).map( ( button ) => button.prop( 'children' ) );

		expect( buttons ).toEqual( [ 'Settings', 'Delete' ] );
	} );

	it( 'should render the HTML mode button', () => {
		const wrapper = shallow(
			<BlockSettingsMenuContent
				uids={ [ 1 ] }
				blockType={ { supportHTML: true } }
				mode="visual"
				{ ...handlers }
			/>
		);
		const buttons = wrapper.find( 'IconButton' ).map( ( button ) => button.prop( 'children' ) );

		expect( buttons ).toEqual( [ 'Settings', 'Edit as HTML', 'Delete' ] );
	} );

	it( 'should render the Visual mode button', () => {
		const wrapper = shallow(
			<BlockSettingsMenuContent
				uids={ [ 1 ] }
				blockType={ { supportHTML: true } }
				mode="html"
				{ ...handlers }
			/>
		);
		const buttons = wrapper.find( 'IconButton' ).map( ( button ) => button.prop( 'children' ) );

		expect( buttons ).toEqual( [ 'Settings', 'Edit visually', 'Delete' ] );
	} );
} );
