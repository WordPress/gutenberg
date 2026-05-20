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
import { useCropper } from '../../image-editor';

const FREE_ASPECT_RATIO_VALUE = '0';
const DEFAULT_FREEFORM_CROP = true;

interface CropOptionsSatelliteSnapshot {
	aspectRatioValue: string;
	freeformCrop: boolean;
}

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
	const cropper = useCropper();
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

	// Latest-value refs so the satellite snapshot getter (called by the
	// cropper hook just before recording a history entry) always reads
	// the freshest values without forcing callback identity changes.
	// The write happens in an effect (not at render time) to satisfy
	// `react-hooks/refs`; the effect flushes after commit and runs
	// before the notify-on-change effect below (source order), so any
	// `getSnapshot` call triggered downstream sees up-to-date values.
	const aspectRatioValueRef = useRef( aspectRatioValue );
	const freeformCropRef = useRef( freeformCrop );
	useEffect( () => {
		aspectRatioValueRef.current = aspectRatioValue;
		freeformCropRef.current = freeformCrop;
	}, [ aspectRatioValue, freeformCrop ] );

	// Register the satellite once. The cropper hook calls `getSnapshot`
	// before each push and `restoreSnapshot` on undo/redo — wiring the
	// sidebar UI state into the cropper's existing undo history so a
	// CMD+Z after an aspect-ratio change reverts both the canvas and
	// the sidebar control.
	const { registerHistorySatellite, notifySatelliteChanged } = cropper;
	useEffect( () => {
		const unregister =
			registerHistorySatellite< CropOptionsSatelliteSnapshot >( {
				getSnapshot: () => ( {
					aspectRatioValue: aspectRatioValueRef.current,
					freeformCrop: freeformCropRef.current,
				} ),
				// Use the raw `useState` setters, not the public
				// `setAspectRatioValue` wrapper — the wrapper auto-enables
				// freeform when the new value is "Free", which would
				// corrupt a restored `(Free, freeform=false)` pairing.
				restoreSnapshot: ( snapshot ) => {
					setAspectRatioValueState( snapshot.aspectRatioValue );
					setFreeformCrop( snapshot.freeformCrop );
				},
				areSnapshotsEqual: ( a, b ) =>
					a.aspectRatioValue === b.aspectRatioValue &&
					a.freeformCrop === b.freeformCrop,
			} );
		return unregister;
	}, [ registerHistorySatellite ] );

	// Tell the cropper hook to re-evaluate the debounce whenever the
	// sidebar state changes. Required so satellite-only edits (e.g.
	// toggling Resize-crop on, which doesn't move the crop rect) still
	// produce an undo step.
	useEffect( () => {
		notifySatelliteChanged();
	}, [ aspectRatioValue, freeformCrop, notifySatelliteChanged ] );

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
