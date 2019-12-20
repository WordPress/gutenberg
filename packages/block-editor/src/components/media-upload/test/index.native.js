/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { TouchableWithoutFeedback } from 'react-native';
import {
	requestMediaPicker,
	mediaSources,
} from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import {
	MediaUpload,
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
			<MediaUpload allowedTypes={ [] } render={ () => {} } />
		);
		expect( wrapper ).toBeTruthy();
	} );

	it( 'opens media options picker', () => {
		const wrapper = shallow(
			<MediaUpload allowedTypes={ [] } render={ ( { open, getMediaOptions } ) => {
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
					allowedTypes={ [ mediaType ] }
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

	const expectMediaPickerForOption = ( option, allowMultiple, requestFunction ) => {
		requestFunction.mockImplementation( ( source, mediaTypes, multiple, callback ) => {
			expect( mediaTypes[ 0 ] ).toEqual( MEDIA_TYPE_VIDEO );
			if ( multiple ) {
				callback( [ { id: MEDIA_ID, url: MEDIA_URL } ] );
			} else {
				callback( { id: MEDIA_ID, url: MEDIA_URL } );
			}
		} );

		const onSelect = jest.fn();

		const wrapper = shallow(
			<MediaUpload
				allowedTypes={ [ MEDIA_TYPE_VIDEO ] }
				onSelect={ onSelect }
				multiple={ allowMultiple }
				render={ ( { open, getMediaOptions } ) => {
					return (
						<TouchableWithoutFeedback onPress={ open }>
							{ getMediaOptions() }
						</TouchableWithoutFeedback>
					);
				} } />
		);
		wrapper.find( 'Picker' ).simulate( 'change', option );
		const media = { id: MEDIA_ID, url: MEDIA_URL };

		expect( requestFunction ).toHaveBeenCalledTimes( 1 );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith( allowMultiple ? [ media ] : media );
	};

	it( 'can select media from device library', () => {
		expectMediaPickerForOption( mediaSources.deviceLibrary, false, requestMediaPicker );
	} );

	it( 'can select media from WP media library', () => {
		expectMediaPickerForOption( mediaSources.siteMediaLibrary, false, requestMediaPicker );
	} );

	it( 'can select media by capturig', () => {
		expectMediaPickerForOption( mediaSources.deviceCamera, false, requestMediaPicker );
	} );

	it( 'can select multiple media from device library', () => {
		expectMediaPickerForOption( mediaSources.deviceLibrary, true, requestMediaPicker );
	} );

	it( 'can select multiple media from WP media library', () => {
		expectMediaPickerForOption( mediaSources.siteMediaLibrary, true, requestMediaPicker );
	} );
} );
