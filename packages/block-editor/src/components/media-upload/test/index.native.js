/* eslint jest/expect-expect: ["warn", { "assertFunctionNames": ["expect", "expect*"] }] */

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
import { MediaUpload } from '../index';
import {
	MEDIA_TYPE_IMAGE,
	MEDIA_TYPE_VIDEO,
	MEDIA_TYPE_AUDIO,
	OPTION_TAKE_VIDEO,
	OPTION_TAKE_PHOTO,
	OPTION_INSERT_FROM_URL,
	OPTION_WORDPRESS_MEDIA_LIBRARY,
} from '../constants';

const MEDIA_URL = 'http://host.media.type';
const MEDIA_ID = 123;

describe( 'MediaUpload component', () => {
	it( 'renders without crashing', () => {
		const wrapper = render(
			<MediaUpload allowedTypes={ [] } render={ () => null } />
		);
		expect( wrapper ).toBeTruthy();
	} );

	describe( 'Media capture options for different media block types', () => {
		const expectOptionForMediaType = async (
			mediaType,
			expectedOptions
		) => {
			const wrapper = render(
				<MediaUpload
					allowedTypes={ [ mediaType ] }
					onSelectURL={ jest.fn() }
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

			expectedOptions.forEach( ( item ) => {
				const option = wrapper.getByText( item );
				expect( option ).toBeVisible();
			} );
		};

		it( 'shows the correct media capture options for the Image block', () => {
			expectOptionForMediaType( MEDIA_TYPE_IMAGE, [
				OPTION_TAKE_PHOTO,
				OPTION_WORDPRESS_MEDIA_LIBRARY,
				OPTION_INSERT_FROM_URL,
			] );
		} );

		it( 'shows the correct media capture options for the Video block', () => {
			expectOptionForMediaType( MEDIA_TYPE_VIDEO, [
				OPTION_TAKE_VIDEO,
				OPTION_WORDPRESS_MEDIA_LIBRARY,
			] );
		} );

		it( 'shows the correct media capture options for the Audio block', () => {
			expectOptionForMediaType( MEDIA_TYPE_AUDIO, [
				OPTION_INSERT_FROM_URL,
			] );
		} );
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
