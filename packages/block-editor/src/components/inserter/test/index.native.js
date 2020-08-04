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
		const testRenderer = renderer.create(
			<Inserter getStylesFromColorScheme={ getStylesFromColorScheme } />
		);
		const testInstance = testRenderer.root;

		expect( () => {
			testInstance.findByProps( { testID: 'add-block-button' } );
		} ).not.toThrow();
	} );
} );
