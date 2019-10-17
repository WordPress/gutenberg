/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import CardBody from '../body';

describe( 'CardBody', () => {
	describe( 'basic rendering', () => {
		test( 'should have components-card className', () => {
			const wrapper = shallow( <CardBody /> );
			const cardBody = wrapper.find( '.components-card__body' );

			expect( cardBody.length ).toBe( 1 );
		} );

		test( 'should be able to render content', () => {
			const cardBody = shallow(
				<CardBody>
					<div className="content">Hello</div>
				</CardBody>
			);
			const content = cardBody.find( '.content' );

			expect( content.length ).toBe( 1 );
			expect( content.text() ).toBe( 'Hello' );
		} );
	} );

	describe( 'modifiers', () => {
		test( 'should be able to render size modifier', () => {
			const wrapper = shallow( <CardBody size="large" /> );
			const cardBody = wrapper.find( '.components-card__body' );

			expect( cardBody.hasClass( 'is-size-large' ) ).toBe( true );
		} );

		test( 'should be able to render shady modifier', () => {
			const wrapper = shallow( <CardBody isShady /> );
			const cardBody = wrapper.find( '.components-card__body' );

			expect( cardBody.hasClass( 'is-shady' ) ).toBe( true );
		} );
	} );
} );
