/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { TouchableWithoutFeedback } from 'react-native';
import {
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
} from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import {
	MediaUpload,
	MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE,
	MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA,
	MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY,
	MEDIA_TYPE_IMAGE,
	MEDIA_TYPE_VIDEO,
	OPTION_TAKE_VIDEO,
	OPTION_TAKE_PHOTO,
} from '../index';

const MEDIA_URL = 'http://host.media.type';
const MEDIA_ID = 123;

describe( 'MediaUpload component', () => {
	it( 'renders without crashing', () => {
		const wrapper = shallow(
			<MediaUpload render={ () => {} } />
		);
		expect( wrapper ).toBeTruthy();
	} );

	it( 'opens media options picker', () => {
		const wrapper = shallow(
			<MediaUpload render={ ( { open, getMediaOptions } ) => {
				return (
					<TouchableWithoutFeedback onPress={ open }>
						{ getMediaOptions() }
					</TouchableWithoutFeedback>
				);
			} } />
		);
		expect( wrapper.find( 'Picker' ) ).toHaveLength( 1 );
	} );

	it( 'shows right media capture option for media type', () => {
		const expectOptionForMediaType = ( mediaType, expectedOption ) => {
			const wrapper = shallow(
				<MediaUpload
					mediaType={ mediaType }
					render={ ( { open, getMediaOptions } ) => {
						return (
							<TouchableWithoutFeedback onPress={ open }>
								{ getMediaOptions() }
							</TouchableWithoutFeedback>
						);
					} } />
			);
			expect( wrapper.find( 'Picker' ).props().options.filter( ( item ) => item.label === expectedOption ) ).toHaveLength( 1 );
		};
		expectOptionForMediaType( MEDIA_TYPE_IMAGE, OPTION_TAKE_PHOTO );
		expectOptionForMediaType( MEDIA_TYPE_VIDEO, OPTION_TAKE_VIDEO );
	} );

	const expectMediaPickerForOption = ( option, requestFunction ) => {
		requestFunction.mockImplementation( ( mediaTypes, callback ) => {
			expect( mediaTypes[ 0 ] ).toEqual( MEDIA_TYPE_VIDEO );
			callback( MEDIA_ID, MEDIA_URL );
		} );

		const onSelectURL = jest.fn();

		const wrapper = shallow(
			<MediaUpload
				mediaType={ MEDIA_TYPE_VIDEO }
				onSelectURL={ onSelectURL }
				render={ ( { open, getMediaOptions } ) => {
					return (
						<TouchableWithoutFeedback onPress={ open }>
							{ getMediaOptions() }
						</TouchableWithoutFeedback>
					);
				} } />
		);
		wrapper.find( 'Picker' ).simulate( 'change', option );
		expect( requestFunction ).toHaveBeenCalledTimes( 1 );

		expect( onSelectURL ).toHaveBeenCalledTimes( 1 );
		expect( onSelectURL ).toHaveBeenCalledWith( MEDIA_ID, MEDIA_URL );
	};

	it( 'can select media from device library', () => {
		expectMediaPickerForOption( MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE, requestMediaPickFromDeviceLibrary );
	} );

	it( 'can select media from WP media library', () => {
		expectMediaPickerForOption( MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY, requestMediaPickFromMediaLibrary );
	} );

	it( 'can select media by capturig', () => {
		expectMediaPickerForOption( MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA, requestMediaPickFromDeviceCamera );
	} );
} );
