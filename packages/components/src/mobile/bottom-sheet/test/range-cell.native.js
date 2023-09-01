/**
 * External dependencies
 */
import { AccessibilityInfo } from 'react-native';
import { render, fireEvent } from 'test/helpers';

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

beforeAll( () => {
	AccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(
		Promise.resolve( true )
	);
} );

afterAll( () => {
	AccessibilityInfo.isScreenReaderEnabled.mockReset();
} );

it( 'allows modifying units via a11y actions', async () => {
	const mockOpenUnitPicker = jest.fn();
	const { getByLabelText } = render(
		<RangeCell
			label="Opacity"
			minimumValue={ 0 }
			maximumValue={ 100 }
			value={ 50 }
			onChange={ jest.fn() }
			openUnitPicker={ mockOpenUnitPicker }
		/>
	);

	const opacityControl = getByLabelText( /Opacity/ );
	fireEvent( opacityControl, 'accessibilityAction', {
		nativeEvent: { actionName: 'activate' },
	} );

	expect( mockOpenUnitPicker ).toHaveBeenCalled();
} );

describe( 'when range lacks an adjustable unit', () => {
	it( 'disallows modifying units via a11y actions', async () => {
		const { getByLabelText } = render(
			<RangeCell
				label="Opacity"
				minimumValue={ 0 }
				maximumValue={ 100 }
				value={ 50 }
				onChange={ jest.fn() }
			/>
		);

		const opacityControl = getByLabelText( /Opacity/ );
		const { onAccessibilityAction } = opacityControl.props;
		expect( () =>
			onAccessibilityAction( { nativeEvent: { actionName: 'activate' } } )
		).not.toThrow();
	} );
} );
