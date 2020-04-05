/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import CardDivider from '../divider';

describe( 'CardDivider', () => {
	describe( 'basic rendering', () => {
		test( 'should have components-card className', () => {
			const wrapper = shallow( <CardDivider /> );
			const cardDivider = wrapper.find( '.components-card__divider' );

			expect( cardDivider.length ).toBe( 1 );
		} );

		test( 'should not render child content', () => {
			const cardDivider = shallow(
				<CardDivider>
					<div className="content">Hello</div>
				</CardDivider>
			);
			const content = cardDivider.find( '.content' );

			expect( content.length ).toBe( 0 );
		} );

		test( 'should have role of separator', () => {
			const wrapper = shallow( <CardDivider /> );
			const cardDivider = wrapper.find( '.components-card__divider' );

			expect( cardDivider.prop( 'role' ) ).toBe( 'separator' );
		} );
	} );
} );
