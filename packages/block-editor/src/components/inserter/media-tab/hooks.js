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

export function useMediaResults( options = {} ) {
	const [ results, setResults ] = useState();
	const settings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	useEffect( () => {
		( async () => {
			setResults();
			const _media = await settings?.__unstableFetchMedia( options );
			if ( _media ) setResults( _media );
		} )();
	}, Object.values( options ) );
	return results;
}

const MEDIA_CATEGORIES = [
	{ label: __( 'Images' ), name: 'images', mediaType: 'image' },
	{ label: __( 'Videos' ), name: 'videos', mediaType: 'video' },
	{ label: __( 'Audio' ), name: 'audio', mediaType: 'audio' },
];
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
			// If `__unstableFetchMedia` is not defined in block
			// editor settings, do not set any media categories.
			if ( ! fetchMedia ) return;
			const query = {
				context: 'view',
				per_page: 1,
				_fields: [ 'id' ],
			};
			const [ image, video, audio ] = await Promise.allSettled( [
				fetchMedia( { ...query, media_type: 'image' } ),
				fetchMedia( { ...query, media_type: 'video' } ),
				fetchMedia( { ...query, media_type: 'audio' } ),
			] );
			// The `value` property is only present if the promise's status is "fulfilled".
			const showImage = canInsertImage && !! image.value?.length;
			const showVideo = canInsertVideo && !! video.value?.length;
			const showAudio = canInsertAudio && !! audio.value?.length;
			setCategories(
				MEDIA_CATEGORIES.filter(
					( { mediaType } ) =>
						( mediaType === 'image' && showImage ) ||
						( mediaType === 'video' && showVideo ) ||
						( mediaType === 'audio' && showAudio )
				)
			);
		} )();
	}, [ canInsertImage, canInsertVideo, canInsertAudio, fetchMedia ] );
	return categories;
}
