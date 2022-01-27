/**
 * External dependencies
 */
import { render, fireEvent } from 'test/helpers';
import { Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { requestMediaPicker } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import {
	MediaUpload,
	MEDIA_TYPE_IMAGE,
	MEDIA_TYPE_VIDEO,
	MEDIA_TYPE_AUDIO,
	OPTION_TAKE_VIDEO,
	OPTION_TAKE_PHOTO,
	OPTION_INSERT_FROM_URL,
} from '../index';

const MEDIA_URL = 'http://host.media.type';
const MEDIA_ID = 123;

describe( 'MediaUpload component', () => {
	it( 'renders without crashing', () => {
		const wrapper = render(
			<MediaUpload allowedTypes={ [] } render={ () => null } />
		);
		expect( wrapper ).toBeTruthy();
	} );

	it( 'shows right media capture option for media type', () => {
		const expectOptionForMediaType = ( mediaType, expectedOption ) => {
			const wrapper = render(
				<MediaUpload
					allowedTypes={ [ mediaType ] }
					render={ ( { open, getMediaOptions } ) => {
						return (
							<>
								<TouchableWithoutFeedback onPress={ open }>
									<Text>Open Picker</Text>
								</TouchableWithoutFeedback>
								{ getMediaOptions() }
							</>
						);
					} }
				/>
			);
			fireEvent.press( wrapper.getByText( 'Open Picker' ) );

			wrapper.getByText( expectedOption );
		};
		expectOptionForMediaType( MEDIA_TYPE_IMAGE, OPTION_TAKE_PHOTO );
		expectOptionForMediaType( MEDIA_TYPE_VIDEO, OPTION_TAKE_VIDEO );
		expectOptionForMediaType( MEDIA_TYPE_AUDIO, OPTION_INSERT_FROM_URL );
	} );

	const expectMediaPickerForOption = (
		option,
		allowMultiple,
		requestFunction
	) => {
		requestFunction.mockImplementation(
			( source, mediaTypes, multiple, callback ) => {
				expect( mediaTypes[ 0 ] ).toEqual( MEDIA_TYPE_VIDEO );
				if ( multiple ) {
					callback( [ { id: MEDIA_ID, url: MEDIA_URL } ] );
				} else {
					callback( { id: MEDIA_ID, url: MEDIA_URL } );
				}
			}
		);

		const onSelect = jest.fn();

		const wrapper = render(
			<MediaUpload
				allowedTypes={ [ MEDIA_TYPE_VIDEO ] }
				onSelect={ onSelect }
				multiple={ allowMultiple }
				render={ ( { open, getMediaOptions } ) => {
					return (
						<>
							<TouchableWithoutFeedback onPress={ open }>
								<Text>Open Picker</Text>
							</TouchableWithoutFeedback>
							{ getMediaOptions() }
						</>
					);
				} }
			/>
		);
		fireEvent.press( wrapper.getByText( 'Open Picker' ) );
		fireEvent.press( wrapper.getByText( option ) );
		const media = { id: MEDIA_ID, url: MEDIA_URL };

		expect( requestFunction ).toHaveBeenCalledTimes( 1 );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith(
			allowMultiple ? [ media ] : media
		);
	};

	it( 'can select media from device library', () => {
		expectMediaPickerForOption(
			'Choose from device',
			false,
			requestMediaPicker
		);
	} );

	it( 'can select media from WP media library', () => {
		expectMediaPickerForOption(
			'WordPress Media Library',
			false,
			requestMediaPicker
		);
	} );

	it( 'can select media by capturing', () => {
		expectMediaPickerForOption( 'Take a Video', false, requestMediaPicker );
	} );

	it( 'can select multiple media from device library', () => {
		expectMediaPickerForOption(
			'Choose from device',
			true,
			requestMediaPicker
		);
	} );

	it( 'can select multiple media from WP media library', () => {
		expectMediaPickerForOption(
			'WordPress Media Library',
			true,
			requestMediaPicker
		);
	} );
} );
