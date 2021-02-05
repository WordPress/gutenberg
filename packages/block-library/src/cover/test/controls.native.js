/**
 * External dependencies
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { blockSettingsScreens } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Controls from '../controls';
import { IMAGE_BACKGROUND_TYPE } from '../shared';

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
jest.mock( '@react-navigation/core' );
const mockNavigation = {
	navigate: jest.fn(),
};
useNavigation.mockReturnValue( mockNavigation );

const setAttributes = jest.fn();
const didUploadFail = jest.fn();
const isUploadInProgress = jest.fn();
const onClearMedia = jest.fn();
const onSelectMedia = jest.fn();
const hasOnlyColorBackground = false;
const openMediaOptionsRef = { current: jest.fn( () => {} ) };

const MOCK_URL = 'mock-url';
const MOCK_FOCAL_POINT = { x: '0.5', y: '0.5' };

const attributes = {
	backgroundType: IMAGE_BACKGROUND_TYPE,
	hasParallax: false,
	focalPoint: MOCK_FOCAL_POINT,
	onFocalPointChange: jest.fn(),
	url: MOCK_URL,
};

describe( 'Cover block edit controls', () => {
	it( 'allows navigating to focal point settings', async () => {
		const { getByText } = render(
			<Controls
				attributes={ attributes }
				didUploadFail={ didUploadFail }
				hasOnlyColorBackground={ hasOnlyColorBackground }
				isUploadInProgress={ isUploadInProgress }
				onClearMedia={ onClearMedia }
				onSelectMedia={ onSelectMedia }
				openMediaOptionsRef={ openMediaOptionsRef }
				setAttributes={ setAttributes }
			/>
		);
		fireEvent.press( getByText( 'Edit focal point' ) );

		await waitFor( () =>
			expect( mockNavigation.navigate ).toHaveBeenCalledWith(
				blockSettingsScreens.focalPoint,
				{
					url: MOCK_URL,
					focalPoint: MOCK_FOCAL_POINT,
					onFocalPointChange: expect.any( Function ),
				}
			)
		);
	} );
} );
