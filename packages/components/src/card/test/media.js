/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import CardMedia from '../media';

describe( 'CardMedia', () => {
	describe( 'basic rendering', () => {
		test( 'should have components-card className', () => {
			const wrapper = shallow( <CardMedia /> );
			const cardMedia = wrapper.find( '.components-card__media' );

			expect( cardMedia.length ).toBe( 1 );
		} );

		test( 'should be able to render content', () => {
			const cardBody = shallow(
				<CardMedia>
					<div className="content">Hello</div>
				</CardMedia>
			);
			const content = cardBody.find( '.content' );

			expect( content.length ).toBe( 1 );
			expect( content.text() ).toBe( 'Hello' );
		} );
	} );
} );
