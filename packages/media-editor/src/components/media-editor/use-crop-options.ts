/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Media } from '../media-editor-provider';
import {
	DEFAULT_ASPECT_RATIOS,
	ORIGINAL_ASPECT_RATIO,
} from '../../image-editor/core/constants';
import type { AspectRatioPreset } from '../../image-editor/core/constants';

const FREE_ASPECT_RATIO_VALUE = '0';
const DEFAULT_FREEFORM_CROP = true;

interface UseCropOptionsArgs {
	id: number;
	isImage: boolean;
	media?: Media | null;
	aspectRatioPresets?: AspectRatioPreset[];
}

interface UseCropOptionsReturn {
	aspectRatioValue: string;
	setAspectRatioValue: ( value: string ) => void;
	aspectRatioOptions: AspectRatioPreset[];
	freeformCrop: boolean;
	setFreeformCrop: ( value: boolean ) => void;
	resolvedAspectRatio: number | undefined;
	resetCropOptions: () => void;
}

/**
 * Resolve an aspect-ratio preset value into a number suitable for
 * `<Cropper aspectRatio=...>`. Returns `undefined` for Free (no lock).
 *
 * @param value            Preset value as a string.
 * @param imageAspectRatio Image's natural width / height — used for
 *                         the Original preset.
 */
export function resolveAspectRatio(
	value: string,
	imageAspectRatio: number | null
): number | undefined {
	const num = parseFloat( value );
	if ( num === 0 ) {
		return undefined;
	}
	if ( num === ORIGINAL_ASPECT_RATIO && imageAspectRatio ) {
		return imageAspectRatio;
	}
	if ( num > 0 ) {
		return num;
	}
	return undefined;
}

export function getAspectRatioOptions(
	aspectRatioPresets?: AspectRatioPreset[]
): AspectRatioPreset[] {
	return [
		...DEFAULT_ASPECT_RATIOS.filter( ( preset ) => preset.value <= 0 ),
		...( aspectRatioPresets ??
			DEFAULT_ASPECT_RATIOS.filter( ( preset ) => preset.value > 0 ) ),
	];
}

function getImageAspectRatio(
	media: Media | null | undefined,
	isImage: boolean
): number | null {
	if ( ! isImage ) {
		return null;
	}
	const naturalWidth = Number( media?.media_details?.width );
	const naturalHeight = Number( media?.media_details?.height );
	if (
		Number.isFinite( naturalWidth ) &&
		Number.isFinite( naturalHeight ) &&
		naturalHeight > 0
	) {
		return naturalWidth / naturalHeight;
	}
	return null;
}

export function useCropOptions( {
	id,
	isImage,
	media,
	aspectRatioPresets,
}: UseCropOptionsArgs ): UseCropOptionsReturn {
	const [ aspectRatioValue, setAspectRatioValueState ] = useState(
		FREE_ASPECT_RATIO_VALUE
	);
	const [ freeformCrop, setFreeformCrop ] = useState( DEFAULT_FREEFORM_CROP );
	const previousIdRef = useRef( id );

	const aspectRatioOptions = useMemo(
		() => getAspectRatioOptions( aspectRatioPresets ),
		[ aspectRatioPresets ]
	);
	const imageAspectRatio = useMemo(
		() => getImageAspectRatio( media, isImage ),
		[ isImage, media ]
	);
	const resolvedAspectRatio = useMemo(
		() => resolveAspectRatio( aspectRatioValue, imageAspectRatio ),
		[ aspectRatioValue, imageAspectRatio ]
	);

	const resetCropOptions = useCallback( () => {
		setAspectRatioValueState( FREE_ASPECT_RATIO_VALUE );
		setFreeformCrop( DEFAULT_FREEFORM_CROP );
	}, [] );

	const setAspectRatioValue = useCallback( ( value: string ) => {
		setAspectRatioValueState( value );
		if ( value === FREE_ASPECT_RATIO_VALUE ) {
			setFreeformCrop( true );
		}
	}, [] );

	useEffect( () => {
		if ( previousIdRef.current === id ) {
			return;
		}
		previousIdRef.current = id;
		resetCropOptions();
	}, [ id, resetCropOptions ] );

	return {
		aspectRatioValue,
		setAspectRatioValue,
		aspectRatioOptions,
		freeformCrop,
		setFreeformCrop,
		resolvedAspectRatio,
		resetCropOptions,
	};
}
