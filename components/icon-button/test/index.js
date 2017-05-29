/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import IconButton from '../';

describe( 'IconButton', () => {
	describe( 'basic rendering', () => {
		it( 'without modifiers', () => {
			const iconButton = shallow( <IconButton /> );
			expect( iconButton.hasClass( 'components-icon-button' ) ).to.be.true();
			expect( iconButton.prop( 'aria-label' ) ).to.be.undefined();
		} );

		it( 'with icon', () => {
			const iconButton = shallow( <IconButton icon="wordpress" /> );
			expect( iconButton.find( 'Dashicon' ).shallow().hasClass( 'dashicons-wordpress' ) ).to.be.true();
		} );

		it( 'with children', () => {
			const iconButton = shallow( <IconButton children={ <p className="test">Test</p> } /> );
			expect( iconButton.find( '.test' ).shallow().text() ).to.equal( 'Test' );
		} );

		it( 'with label', () => {
			const iconButton = shallow( <IconButton label="WordPress" /> );
			expect( iconButton.prop( 'aria-label' ) ).to.equal( 'WordPress' );
		} );

		it( 'with additonal className', () => {
			const iconButton = shallow( <IconButton className="test" /> );
			expect( iconButton.hasClass( 'test' ) ).to.be.true();
		} );

		it( 'with additonal properties', () => {
			const iconButton = shallow( <IconButton test="test" /> );
			expect( iconButton.node.props.test ).to.equal( 'test' );
		} );
	} );
} );
