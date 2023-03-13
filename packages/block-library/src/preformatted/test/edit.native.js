/**
 * External dependencies
 */
import { render } from 'test/helpers';

/**
 * Internal dependencies
 */
import PreformattedEdit from '../edit';

describe( 'core/more/edit/native', () => {
	it( 'renders without crashing', () => {
		const screen = render(
			<PreformattedEdit
				attributes={ {} }
				setAttributes={ jest.fn() }
				getStylesFromColorScheme={ jest.fn() }
			/>
		);

		expect( screen.container ).toBeDefined();
	} );

	it( 'should match snapshot when content is empty', () => {
		const screen = render(
			<PreformattedEdit
				attributes={ {} }
				setAttributes={ jest.fn() }
				getStylesFromColorScheme={ ( styles1 ) => styles1 }
			/>
		);
		expect( screen.toJSON() ).toMatchSnapshot();
	} );

	it( 'should match snapshot when content is not empty', () => {
		const screen = render(
			<PreformattedEdit
				attributes={ { content: 'Hello World!' } }
				setAttributes={ jest.fn() }
				getStylesFromColorScheme={ ( styles1 ) => styles1 }
			/>
		);
		expect( screen.toJSON() ).toMatchSnapshot();
	} );
} );
