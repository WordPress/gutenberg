/**
 * External dependencies
 */
import { AccessibilityInfo } from 'react-native';
import { create, act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import RangeCell from '../range-cell';

// Avoid errors due to mocked stylesheet files missing required selectors
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	withPreferredColorScheme: jest.fn( ( Component ) => ( props ) => (
		<Component
			{ ...props }
			preferredColorScheme={ {} }
			getStylesFromColorScheme={ jest.fn( () => ( {} ) ) }
		/>
	) ),
} ) );

const isScreenReaderEnabled = Promise.resolve( true );
beforeAll( () => {
	// Mock async native module to avoid act warning
	AccessibilityInfo.isScreenReaderEnabled = jest.fn(
		() => isScreenReaderEnabled
	);
} );

it( 'allows modifying units via a11y actions', async () => {
	const mockOpenUnitPicker = jest.fn();
	const renderer = create(
		<RangeCell
			label="Opacity"
			minimumValue={ 0 }
			maximumValue={ 100 }
			value={ 50 }
			onChange={ jest.fn() }
			openUnitPicker={ mockOpenUnitPicker }
		/>
	);
	// Await async update to component state to avoid act warning
	await act( () => isScreenReaderEnabled );
	const { onAccessibilityAction } = renderer.toJSON().props;

	onAccessibilityAction( { nativeEvent: { actionName: 'activate' } } );
	expect( mockOpenUnitPicker ).toHaveBeenCalled();
} );

describe( 'when range lacks an adjustable unit', () => {
	it( 'disallows modifying units via a11y actions', async () => {
		const renderer = create(
			<RangeCell
				label="Opacity"
				minimumValue={ 0 }
				maximumValue={ 100 }
				value={ 50 }
				onChange={ jest.fn() }
			/>
		);
		// Await async update to component state to avoid act warning
		await act( () => isScreenReaderEnabled );
		const { onAccessibilityAction } = renderer.toJSON().props;

		expect( () =>
			onAccessibilityAction( { nativeEvent: { actionName: 'activate' } } )
		).not.toThrow();
	} );
} );
