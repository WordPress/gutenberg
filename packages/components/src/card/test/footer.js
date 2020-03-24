/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import CardFooter from '../footer';

describe( 'CardFooter', () => {
	describe( 'basic rendering', () => {
		test( 'should have components-card className', () => {
			const wrapper = shallow( <CardFooter /> );
			const cardFooter = wrapper.find( '.components-card__footer' );

			expect( cardFooter.length ).toBe( 1 );
		} );

		test( 'should be able to render content', () => {
			const cardFooter = shallow(
				<CardFooter>
					<div className="content">Hello</div>
				</CardFooter>
			);
			const content = cardFooter.find( '.content' );

			expect( content.length ).toBe( 1 );
			expect( content.text() ).toBe( 'Hello' );
		} );
	} );

	describe( 'modifiers', () => {
		test( 'should be able to render padding modifier', () => {
			const wrapper = shallow( <CardFooter padding="large" /> );
			const cardFooter = wrapper.find( '.components-card__footer' );

			expect( cardFooter.hasClass( 'is-padding-large' ) ).toBe( true );
		} );

		test( 'should be able to render shady modifier', () => {
			const wrapper = shallow( <CardFooter isShady /> );
			const cardFooter = wrapper.find( '.components-card__footer' );

			expect( cardFooter.hasClass( 'is-shady' ) ).toBe( true );
		} );

		test( 'should be able to render borderless modifier', () => {
			const wrapper = shallow( <CardFooter isBorderless /> );
			const cardFooter = wrapper.find( '.components-card__footer' );

			expect( cardFooter.hasClass( 'is-borderless' ) ).toBe( true );
		} );
	} );
} );
