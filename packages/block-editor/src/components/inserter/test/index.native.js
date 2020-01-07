/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import Inserter from '../index';
import '../../..'; // Ensure store dependencies are imported via root.

describe( 'Inserter', () => {
	it( 'button contains the testID "add-block-button"', () => {
		const component = renderer.create( <Inserter /> );
		const rendered = component.toJSON();
		expect( rendered.children[ 0 ].props.testID ).toEqual( 'add-block-button' );
	} );
} );
