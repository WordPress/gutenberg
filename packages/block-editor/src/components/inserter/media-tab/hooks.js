/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useDebounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

export function useDebouncedInput() {
	const [ input, setInput ] = useState( '' );
	const [ debounced, setter ] = useState( '' );
	const setDebounced = useDebounce( setter, 250 );
	useEffect( () => {
		if ( debounced !== input ) {
			setDebounced( input );
		}
	}, [ debounced, input ] );
	return [ input, setInput, debounced ];
}

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
	}, [ ...Object.values( options ) ] );
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
			const [ image, video, audio ] = await Promise.all( [
				fetchMedia( { ...query, media_type: 'image' } ),
				fetchMedia( { ...query, media_type: 'video' } ),
				fetchMedia( { ...query, media_type: 'audio' } ),
			] );
			const showImage = canInsertImage && !! image.length;
			const showVideo = canInsertVideo && !! video.length;
			const showAudio = canInsertAudio && !! audio.length;
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
