/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { Inserter } from '../index';
import '../../..'; // Ensure store dependencies are imported via root.

const getStylesFromColorScheme = () => {
	return { color: 'white' };
};

describe( 'Inserter', () => {
	it( 'button contains the testID "add-block-button"', () => {
		const component = renderer.create(
			<Inserter
				getStylesFromColorScheme={ getStylesFromColorScheme }
			/>
		);
		const rendered = component.toJSON();
		expect( rendered[ 0 ].children[ 0 ].props.testID ).toEqual( 'add-block-button' );
	} );
} );
