/**
 * External dependencies
 */
import ShallowRenderer from 'react-test-renderer/shallow';
const shallowRenderer = new ShallowRenderer();

/**
 * Internal dependencies
 */
import { PreformattedEdit } from '../edit';

describe( 'core/more/edit/native', () => {
	it( 'renders without crashing', () => {
		shallowRenderer.render(
			<PreformattedEdit
				setAttributes={ jest.fn() }
				getStylesFromColorScheme={ jest.fn() }
			/>
		);
		const element = shallowRenderer.getRenderOutput();
		expect( element.type ).toBeDefined();
	} );

	it( 'should match snapshot when content is empty', () => {
		shallowRenderer.render(
			<PreformattedEdit
				setAttributes={ jest.fn() }
				getStylesFromColorScheme={ ( styles1 ) => styles1 }
			/>
		);
		expect( shallowRenderer.getRenderOutput() ).toMatchSnapshot();
	} );

	it( 'should match snapshot when content is not empty', () => {
		shallowRenderer.render(
			<PreformattedEdit
				attributes={ { content: 'Hello World!' } }
				setAttributes={ jest.fn() }
				getStylesFromColorScheme={ ( styles1 ) => styles1 }
			/>
		);
		expect( shallowRenderer.getRenderOutput() ).toMatchSnapshot();
	} );
} );
