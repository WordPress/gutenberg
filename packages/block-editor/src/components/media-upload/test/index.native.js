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
					canUploadMedia={ true }
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

	function openMediaPicker( requestFunction, allowMultiple, canUploadMedia ) {
		requestFunction.mockImplementation(
			( _source, mediaTypes, multiple, callback ) => {
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
				canUploadMedia={ canUploadMedia }
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
		return { onSelect, wrapper };
	}

	describe( 'selecting media', () => {
		const expectMediaPickerForOption = (
			option,
			allowMultiple,
			canUploadMedia,
			exists
		) => {
			const { onSelect, wrapper } = openMediaPicker(
				requestMediaPicker,
				allowMultiple,
				canUploadMedia
			);

			const optionInstance = wrapper.queryByText( option );
			if ( exists ) {
				expect( optionInstance ).toBeDefined();
				fireEvent.press( optionInstance );
				const media = { id: MEDIA_ID, url: MEDIA_URL };

				expect( requestMediaPicker ).toHaveBeenCalledTimes( 1 );

				expect( onSelect ).toHaveBeenCalledTimes( 1 );
				expect( onSelect ).toHaveBeenCalledWith(
					allowMultiple ? [ media ] : media
				);
			} else {
				expect( optionInstance ).toBeNull();
			}
		};

		describe( 'when uploads are enabled', () => {
			const expectWhenUploadsEnabled = ( option, allowMultiple ) => {
				expectMediaPickerForOption( option, allowMultiple, true, true );
			};

			it( 'from WP media library', () => {
				expectWhenUploadsEnabled( 'WordPress Media Library', true );
			} );

			it( 'can select media from device library', () => {
				expectWhenUploadsEnabled( 'Choose from device', false );
			} );

			it( 'can select media by capturing', () => {
				expectWhenUploadsEnabled( 'Take a Video', false );
			} );

			it( 'can select multiple media from device library', () => {
				expectWhenUploadsEnabled( 'Choose from device', true );
			} );
		} );

		describe( 'when uploads are disabled', () => {
			const expectWhenUploadsDisabled = (
				option,
				allowMultiple,
				exists
			) => {
				expectMediaPickerForOption(
					option,
					allowMultiple,
					false,
					exists
				);
			};

			it( 'from WP media library', () => {
				expectWhenUploadsDisabled(
					'WordPress Media Library',
					true,
					true
				);
			} );

			it( 'can select media from device library', () => {
				expectWhenUploadsDisabled( 'Choose from device', false, false );
			} );

			it( 'can select media by capturing', () => {
				expectWhenUploadsDisabled( 'Take a Video', false, false );
			} );

			it( 'can select multiple media from device library', () => {
				expectWhenUploadsDisabled( 'Choose from device', true, false );
			} );
		} );
	} );
} );
