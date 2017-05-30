/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Dashicon from '../';

describe( 'Dashicon', () => {
	describe( 'basic rendering', () => {
		it( 'without properties', () => {
			const dashicon = shallow( <Dashicon /> );
			// Unrendered element.
			expect( dashicon.type() ).to.be.null();
		} );

		it( 'with icon property', () => {
			const dashicon = shallow( <Dashicon icon="wordpress" /> );
			// OH NO CAPITAL P DANGIT!
			expect( dashicon.find( 'title' ).text() ).to.equal( 'Wordpress' );
			expect( dashicon.hasClass( 'dashicon' ) ).to.be.true();
			expect( dashicon.hasClass( 'dashicons-wordpress' ) ).to.be.true();
			expect( dashicon.type() ).to.equal( 'svg' );
			expect( dashicon.prop( 'xmlns' ) ).to.equal( 'http://www.w3.org/2000/svg' );
			expect( dashicon.prop( 'width' ) ).to.equal( '20' );
			expect( dashicon.prop( 'height' ) ).to.equal( '20' );
			expect( dashicon.prop( 'viewBox' ) ).to.equal( '0 0 20 20' );
		} );

		it( 'with additional class name', () => {
			const dashicon = shallow( <Dashicon icon="wordpress" className="capital-p-dangit" /> );
			expect( dashicon.hasClass( 'capital-p-dangit' ) ).to.be.true();
		} );
	} );
} );
