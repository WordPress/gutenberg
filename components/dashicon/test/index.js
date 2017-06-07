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
		it( 'should render an empty null element when icon is not provided', () => {
			const dashicon = shallow( <Dashicon /> );
			// Unrendered element.
			expect( dashicon.type() ).to.be.null();
		} );

		it( 'should render an empty null element when a non dashicon is provided', () => {
			const dashicon = shallow( <Dashicon icon="zomg-never-gonna-be-an-icon-icon" /> );
			// Unrendered element.
			expect( dashicon.type() ).to.be.null();
		} );

		it( 'should render a SVG icon element when a matching icon is provided', () => {
			const dashicon = shallow( <Dashicon icon="wordpress" /> );
			expect( dashicon.hasClass( 'dashicon' ) ).to.be.true();
			expect( dashicon.hasClass( 'dashicons-wordpress' ) ).to.be.true();
			expect( dashicon.type() ).to.equal( 'svg' );
			expect( dashicon.prop( 'xmlns' ) ).to.equal( 'http://www.w3.org/2000/svg' );
			expect( dashicon.prop( 'width' ) ).to.equal( '20' );
			expect( dashicon.prop( 'height' ) ).to.equal( '20' );
			expect( dashicon.prop( 'viewBox' ) ).to.equal( '0 0 20 20' );
		} );

		it( 'should render an additional class to the SVG element', () => {
			const dashicon = shallow( <Dashicon icon="wordpress" className="capital-p-dangit" /> );
			expect( dashicon.hasClass( 'capital-p-dangit' ) ).to.be.true();
		} );
	} );
} );
