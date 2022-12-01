/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

// Notes about the abstrction:
// 1. Some external media might exceed the file size limit allowed. Check how to handle this..
// 2. do I really need to add `type:external`? Could the abstraction work by
// just using `__unstableFetchMedia` and move all the `fetchExternalMedia`
// handling to that function? On the other hand it might be useful to have this here,
// so it can be used by other extenders..
// 3. Define a common interface for media items that makes sense for all.(ex. check order that is not supported by Openverse)
const MEDIA_CATEGORIES = [
	{
		label: __( 'Images' ),
		name: 'images',
		mediaType: 'image',
		defaultRequestArgs: { media_type: 'image' },
	},
	{
		label: __( 'Videos' ),
		name: 'videos',
		mediaType: 'video',
		defaultRequestArgs: { media_type: 'video' },
	},
	{
		label: __( 'Audio' ),
		name: 'audio',
		mediaType: 'audio',
		defaultRequestArgs: { media_type: 'audio' },
	},
	{
		label: 'Openverse',
		name: 'openverse',
		mediaType: 'image',
		type: 'external',
		url: 'https://api.openverse.engineering/v1/images/',
		defaultRequestArgs: {
			mature: false,
			excluded_source: 'flickr',
			license: 'cc0',
		},
		requestMap: {
			per_page: 'page_size',
			search: 'q',
		},
		responseResults: 'results',
		responseMap: {},
	},
];
const getInternalMediaCategories = () => {
	return MEDIA_CATEGORIES.filter( ( { type } ) => type !== 'external' );
};
const getExternalMediaCategories = () => {
	return MEDIA_CATEGORIES.filter( ( { type } ) => type === 'external' );
};
export function useMediaCategories( rootClientId ) {
	const [ categories, setCategories ] = useState( [] );
	const { canInsertImage, canInsertVideo, canInsertAudio, fetchMedia } =
		useSelect(
			( select ) => {
				const { canInsertBlockType, getSettings } =
					select( blockEditorStore );
				return {
					fetchMedia: getSettings().__unstableFetchMedia,
					canInsertImage: canInsertBlockType(
						'core/image',
						rootClientId
					),
					canInsertVideo: canInsertBlockType(
						'core/video',
						rootClientId
					),
					canInsertAudio: canInsertBlockType(
						'core/audio',
						rootClientId
					),
				};
			},
			[ rootClientId ]
		);
	useEffect( () => {
		( async () => {
			const _categories = [];
			// If `__unstableFetchMedia` is not defined in block editor settings,
			// do not show internal media categories that rely on it.
			if ( fetchMedia ) {
				const query = {
					context: 'view',
					per_page: 1,
					_fields: [ 'id' ],
				};
				const [ image, video, audio ] = await Promise.all( [
					fetchMedia( { ...query, media_type: 'image' } ),
					fetchMedia( { ...query, media_type: 'video' } ),
					fetchMedia( { ...query, media_type: 'audio' } ),
				] );
				const showImage = canInsertImage && !! image.length;
				const showVideo = canInsertVideo && !! video.length;
				const showAudio = canInsertAudio && !! audio.length;
				const internalCategories = getInternalMediaCategories().filter(
					( { mediaType } ) =>
						( mediaType === 'image' && showImage ) ||
						( mediaType === 'video' && showVideo ) ||
						( mediaType === 'audio' && showAudio )
				);
				_categories.push( ...internalCategories );
			}
			// Add the eligible categories with `extenal` sources(ex. Openverse).
			const externalMediaCategories = getExternalMediaCategories().filter(
				( { mediaType } ) => {
					return (
						( mediaType === 'image' && canInsertImage ) ||
						( mediaType === 'video' && canInsertVideo ) ||
						( mediaType === 'audio' && canInsertAudio )
					);
				}
			);
			_categories.push( ...externalMediaCategories );
			if ( !! _categories.length ) {
				setCategories( _categories );
			}
		} )();
	}, [ canInsertImage, canInsertVideo, canInsertAudio, fetchMedia ] );
	return categories;
}
