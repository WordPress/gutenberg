/**
 * External dependencies
 */
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import PreFormatted from '../edit';
/**
 * WordPress dependencies
 */

const getTestComponentWithContent = ( content ) => {
	return shallow(
		<PreFormatted
			attributes={ { content } }
			setAttributes={ jest.fn() }
		/>
	);
};

describe( 'Preformatted', () => {
	it( 'renders without crashing', () => {
		const component = renderer.create( getTestComponentWithContent( '' ) );
		expect( component.exists() ).toBe( true );
	} );

	it( 'renders given text without crashing', () => {
		const component = renderer.create( getTestComponentWithContent( 'Hello world!' ) );
		expect( component.exists() ).toBe( true );
	} );
} );
