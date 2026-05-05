/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import {
	CropperProvider,
	areImageEditAdjustmentsDefault,
	exportImageEdit,
	useCropperState,
	type CropperState,
	type ImageEditAdjustmentValues,
	type UseCropperStateReturn,
} from '../../image-editor';
import { useHistory } from '../../image-editor/react/hooks/use-history';
import {
	buildModifiers,
	type Modifier,
} from '../media-editor-modal/build-modifiers';

export interface ImageEditingSessionImage {
	src: string;
	width: number;
	height: number;
}

export type ImageEditingAdjustments = ImageEditAdjustmentValues;

export const DEFAULT_IMAGE_EDITING_ADJUSTMENTS: ImageEditingAdjustments = {
	brightness: 1,
	contrast: 1,
	saturation: 1,
	grayscale: 0,
};

type HistoryDomain = 'cropper' | 'adjustments';
const HISTORY_EPSILON = 1e-6;

function nearlyEqual( a: number, b: number ): boolean {
	return Math.abs( a - b ) < HISTORY_EPSILON;
}

function areImagesEqual(
	a: ImageEditingSessionImage | null,
	b: ImageEditingSessionImage | null
): boolean {
	return (
		a?.src === b?.src && a?.width === b?.width && a?.height === b?.height
	);
}

function areCropperImagesEqual(
	a: CropperState[ 'image' ],
	b: CropperState[ 'image' ]
): boolean {
	return (
		a?.src === b?.src &&
		a?.naturalWidth === b?.naturalWidth &&
		a?.naturalHeight === b?.naturalHeight
	);
}

function areAdjustmentsEqual(
	a: ImageEditingAdjustments,
	b: ImageEditingAdjustments
): boolean {
	return (
		a.brightness === b.brightness &&
		a.contrast === b.contrast &&
		a.saturation === b.saturation &&
		a.grayscale === b.grayscale
	);
}

function areCropperStatesEqual( a: CropperState, b: CropperState ): boolean {
	const aImage = a.image;
	const bImage = b.image;
	return (
		aImage?.src === bImage?.src &&
		aImage?.naturalWidth === bImage?.naturalWidth &&
		aImage?.naturalHeight === bImage?.naturalHeight &&
		nearlyEqual( a.pan.x, b.pan.x ) &&
		nearlyEqual( a.pan.y, b.pan.y ) &&
		nearlyEqual( a.zoom, b.zoom ) &&
		nearlyEqual( a.rotation, b.rotation ) &&
		a.flip.horizontal === b.flip.horizontal &&
		a.flip.vertical === b.flip.vertical &&
		nearlyEqual( a.cropRect.x, b.cropRect.x ) &&
		nearlyEqual( a.cropRect.y, b.cropRect.y ) &&
		nearlyEqual( a.cropRect.width, b.cropRect.width ) &&
		nearlyEqual( a.cropRect.height, b.cropRect.height )
	);
}

export interface ImageEditingSession {
	/** Original image source loaded into the current session. */
	sourceImage: ImageEditingSessionImage | null;
	/** Current image source being edited by the image session. */
	workingImage: ImageEditingSessionImage | null;
	/** Low-level cropper controller. */
	cropper: UseCropperStateReturn;
	/** Image adjustment values applied to the current working image. */
	adjustments: ImageEditingAdjustments;
	/** Replace the source image and reset dependent image edits. */
	setSourceImage: ( image: ImageEditingSessionImage | null ) => void;
	/** Set one image adjustment value. */
	setAdjustment: < K extends keyof ImageEditingAdjustments >(
		key: K,
		value: ImageEditingAdjustments[ K ]
	) => void;
	/** Reset image adjustments to their defaults. */
	resetAdjustments: () => void;
	/** Whether the image session has unsaved image edits. */
	isDirty: boolean;
	/** Whether the session contains preview edits that are not saveable yet. */
	hasPreviewOnlyEdits: boolean;
	/** Whether saving must upload a replacement image blob. */
	hasReplacementImageEdits: boolean;
	/** Whether the image session has undo history. */
	hasUndo: boolean;
	/** Whether the image session has redo history. */
	hasRedo: boolean;
	/** Undo the last image session edit. */
	undo: () => void;
	/** Redo the last undone image session edit. */
	redo: () => void;
	/** Reset the current image edits. */
	reset: () => void;
	/** Commit any pending continuous edit to history. */
	commitHistory: () => void;
	/** Build the Core REST media edit modifiers for the current image state. */
	buildSaveModifiers: () => Modifier[];
	/** Export the current image edit as replacement image bytes. */
	exportImageEdit: ( mimeType?: string, quality?: number ) => Promise< Blob >;
}

const ImageEditingSessionContext = createContext<
	ImageEditingSession | undefined
>( undefined );

export function ImageEditingSessionProvider( {
	children,
}: {
	children: ReactNode;
} ) {
	const cropper = useCropperState();
	const setCropperImage = cropper.setImage;
	const [ sourceImage, setSourceImageState ] =
		useState< ImageEditingSessionImage | null >( null );
	const [ adjustments, setAdjustments ] = useState< ImageEditingAdjustments >(
		DEFAULT_IMAGE_EDITING_ADJUSTMENTS
	);
	const cropperStateRef = useRef( cropper.state );
	const adjustmentsRef = useRef( adjustments );
	const pendingCropperBaselineRef = useRef< CropperState | null >( null );
	const pendingAdjustmentBaselineRef =
		useRef< ImageEditingAdjustments | null >( null );
	const undoDomainStackRef = useRef< HistoryDomain[] >( [] );
	const redoDomainStackRef = useRef< HistoryDomain[] >( [] );

	useEffect( () => {
		cropperStateRef.current = cropper.state;
	}, [ cropper.state ] );

	useEffect( () => {
		adjustmentsRef.current = adjustments;
	}, [ adjustments ] );

	const applyAdjustmentsState = useCallback(
		( nextAdjustments: ImageEditingAdjustments ) => {
			adjustmentsRef.current = nextAdjustments;
			setAdjustments( nextAdjustments );
		},
		[]
	);

	const pushUndoDomain = useCallback( ( domain: HistoryDomain ) => {
		undoDomainStackRef.current = [ ...undoDomainStackRef.current, domain ];
		redoDomainStackRef.current = [];
	}, [] );

	const clearSessionHistory = useCallback( () => {
		pendingCropperBaselineRef.current = null;
		pendingAdjustmentBaselineRef.current = null;
		undoDomainStackRef.current = [];
		redoDomainStackRef.current = [];
	}, [] );

	const {
		hasUndo: hasAdjustmentsUndo,
		hasRedo: hasAdjustmentsRedo,
		pushHistory: pushAdjustmentsHistory,
		commitHistory: commitAdjustmentsHistory,
		undo: undoAdjustments,
		redo: redoAdjustments,
		suppressNextChange: suppressNextAdjustmentsChange,
		clearHistory: clearAdjustmentsHistory,
	} = useHistory( {
		state: adjustments,
		isEqual: areAdjustmentsEqual,
		onApplyState: applyAdjustmentsState,
		debounceMs: 300,
	} );

	const areAdjustmentsDirty = ! areAdjustmentsEqual(
		adjustments,
		DEFAULT_IMAGE_EDITING_ADJUSTMENTS
	);
	const hasReplacementImageEdits =
		! areImageEditAdjustmentsDefault( adjustments );

	const markCropperEdited = useCallback( () => {
		if ( pendingAdjustmentBaselineRef.current ) {
			return;
		}
		if ( ! pendingCropperBaselineRef.current ) {
			pendingCropperBaselineRef.current = cropperStateRef.current;
		}
		redoDomainStackRef.current = [];
	}, [] );

	const setSourceImage = useCallback(
		( image: ImageEditingSessionImage | null ) => {
			if ( areImagesEqual( sourceImage, image ) ) {
				return;
			}
			setSourceImageState( image );
			adjustmentsRef.current = DEFAULT_IMAGE_EDITING_ADJUSTMENTS;
			clearSessionHistory();
			setAdjustments( DEFAULT_IMAGE_EDITING_ADJUSTMENTS );
			clearAdjustmentsHistory( DEFAULT_IMAGE_EDITING_ADJUSTMENTS );
			setCropperImage(
				image
					? {
							src: image.src,
							naturalWidth: image.width,
							naturalHeight: image.height,
					  }
					: null
			);
		},
		[
			clearAdjustmentsHistory,
			clearSessionHistory,
			setCropperImage,
			sourceImage,
		]
	);

	const setAdjustment = useCallback(
		< K extends keyof ImageEditingAdjustments >(
			key: K,
			value: ImageEditingAdjustments[ K ]
		) => {
			const currentAdjustments = adjustmentsRef.current;
			if ( currentAdjustments[ key ] === value ) {
				return;
			}
			if ( ! pendingAdjustmentBaselineRef.current ) {
				pendingAdjustmentBaselineRef.current = currentAdjustments;
			}
			suppressNextAdjustmentsChange( { clearPending: true } );
			redoDomainStackRef.current = [];
			applyAdjustmentsState( {
				...currentAdjustments,
				[ key ]: value,
			} );
		},
		[ applyAdjustmentsState, suppressNextAdjustmentsChange ]
	);

	const resetAdjustments = useCallback( () => {
		const currentAdjustments = adjustmentsRef.current;
		if (
			areAdjustmentsEqual(
				currentAdjustments,
				DEFAULT_IMAGE_EDITING_ADJUSTMENTS
			)
		) {
			return;
		}
		commitAdjustmentsHistory();
		pushAdjustmentsHistory( currentAdjustments );
		suppressNextAdjustmentsChange();
		pendingAdjustmentBaselineRef.current = null;
		pushUndoDomain( 'adjustments' );
		applyAdjustmentsState( DEFAULT_IMAGE_EDITING_ADJUSTMENTS );
	}, [
		applyAdjustmentsState,
		commitAdjustmentsHistory,
		pushAdjustmentsHistory,
		pushUndoDomain,
		suppressNextAdjustmentsChange,
	] );

	const commitCropperHistory = useCallback( () => {
		const pendingCropperBaseline = pendingCropperBaselineRef.current;
		cropper.commitHistory();
		if (
			pendingCropperBaseline &&
			! areCropperStatesEqual(
				pendingCropperBaseline,
				cropperStateRef.current
			)
		) {
			pushUndoDomain( 'cropper' );
		}
		pendingCropperBaselineRef.current = null;
	}, [ cropper, pushUndoDomain ] );

	const commitHistory = useCallback( () => {
		const pendingAdjustmentBaseline = pendingAdjustmentBaselineRef.current;
		if ( pendingAdjustmentBaseline ) {
			if (
				! areAdjustmentsEqual(
					pendingAdjustmentBaseline,
					adjustmentsRef.current
				)
			) {
				pushAdjustmentsHistory( pendingAdjustmentBaseline );
				pushUndoDomain( 'adjustments' );
			}
			suppressNextAdjustmentsChange( { clearPending: true } );
			pendingAdjustmentBaselineRef.current = null;
			return;
		}
		commitCropperHistory();
		commitAdjustmentsHistory();
	}, [
		commitCropperHistory,
		commitAdjustmentsHistory,
		pushAdjustmentsHistory,
		pushUndoDomain,
		suppressNextAdjustmentsChange,
	] );

	const sessionCropper = useMemo< UseCropperStateReturn >(
		() => ( {
			...cropper,
			setImage: ( image ) => {
				if (
					! areCropperImagesEqual(
						cropperStateRef.current.image,
						image
					)
				) {
					clearSessionHistory();
				}
				cropper.setImage( image );
			},
			setPan: ( pan ) => {
				markCropperEdited();
				cropper.setPan( pan );
			},
			setZoom: ( zoom ) => {
				markCropperEdited();
				cropper.setZoom( zoom );
			},
			setZoomAtPoint: ( zoom, pan ) => {
				markCropperEdited();
				cropper.setZoomAtPoint( zoom, pan );
			},
			setRotation: ( rotation ) => {
				markCropperEdited();
				cropper.setRotation( rotation );
			},
			setFlip: ( flip ) => {
				markCropperEdited();
				cropper.setFlip( flip );
			},
			toggleFlip: ( direction ) => {
				markCropperEdited();
				cropper.toggleFlip( direction );
			},
			snapRotate90: ( direction ) => {
				markCropperEdited();
				cropper.snapRotate90( direction );
			},
			setCropRect: ( rect ) => {
				markCropperEdited();
				cropper.setCropRect( rect );
			},
			settleCrop: () => {
				markCropperEdited();
				cropper.settleCrop();
			},
			applyOperation: ( op ) => {
				markCropperEdited();
				cropper.applyOperation( op );
			},
			reset: ( resetState ) => {
				markCropperEdited();
				cropper.reset( resetState );
			},
			commitHistory: commitCropperHistory,
		} ),
		[
			clearSessionHistory,
			commitCropperHistory,
			cropper,
			markCropperEdited,
		]
	);

	const undo = useCallback( () => {
		commitHistory();
		const domain =
			undoDomainStackRef.current[ undoDomainStackRef.current.length - 1 ];
		if ( domain ) {
			undoDomainStackRef.current = undoDomainStackRef.current.slice(
				0,
				-1
			);
			redoDomainStackRef.current = [
				domain,
				...redoDomainStackRef.current,
			];
			if ( domain === 'adjustments' ) {
				undoAdjustments();
				return;
			}
			cropper.undo();
			return;
		}
		if ( hasAdjustmentsUndo || areAdjustmentsDirty ) {
			undoAdjustments();
			redoDomainStackRef.current = [
				'adjustments',
				...redoDomainStackRef.current,
			];
			return;
		}
		if ( cropper.hasUndo ) {
			cropper.undo();
			redoDomainStackRef.current = [
				'cropper',
				...redoDomainStackRef.current,
			];
		}
	}, [
		areAdjustmentsDirty,
		commitHistory,
		cropper,
		hasAdjustmentsUndo,
		undoAdjustments,
	] );

	const redo = useCallback( () => {
		const domain = redoDomainStackRef.current[ 0 ];
		if ( domain ) {
			redoDomainStackRef.current = redoDomainStackRef.current.slice( 1 );
			undoDomainStackRef.current = [
				...undoDomainStackRef.current,
				domain,
			];
			if ( domain === 'adjustments' ) {
				redoAdjustments();
				return;
			}
			cropper.redo();
			return;
		}
		if ( hasAdjustmentsRedo ) {
			redoAdjustments();
			undoDomainStackRef.current = [
				...undoDomainStackRef.current,
				'adjustments',
			];
			return;
		}
		if ( cropper.hasRedo ) {
			cropper.redo();
			undoDomainStackRef.current = [
				...undoDomainStackRef.current,
				'cropper',
			];
		}
	}, [ cropper, hasAdjustmentsRedo, redoAdjustments ] );

	const reset = useCallback( () => {
		cropper.reset();
		resetAdjustments();
	}, [ cropper, resetAdjustments ] );

	const workingImage = sourceImage;

	const buildSaveModifiers = useCallback( () => {
		if ( hasReplacementImageEdits || ! cropper.isDirty || ! workingImage ) {
			return [];
		}
		return buildModifiers( cropper.state, {
			width: workingImage.width,
			height: workingImage.height,
		} );
	}, [
		cropper.isDirty,
		cropper.state,
		hasReplacementImageEdits,
		workingImage,
	] );

	const exportSessionImageEdit = useCallback(
		( mimeType?: string, quality?: number ) => {
			if ( ! sourceImage ) {
				return Promise.reject(
					new Error( 'No source image is loaded.' )
				);
			}
			return exportImageEdit( {
				src: sourceImage.src,
				state: cropper.state,
				adjustments,
				mimeType,
				quality,
			} );
		},
		[ adjustments, cropper.state, sourceImage ]
	);

	const session = useMemo< ImageEditingSession >(
		() => ( {
			sourceImage,
			workingImage,
			cropper: sessionCropper,
			adjustments,
			setSourceImage,
			setAdjustment,
			resetAdjustments,
			isDirty: cropper.isDirty || areAdjustmentsDirty,
			hasPreviewOnlyEdits: false,
			hasReplacementImageEdits,
			hasUndo: cropper.hasUndo || hasAdjustmentsUndo,
			hasRedo: cropper.hasRedo || hasAdjustmentsRedo,
			undo,
			redo,
			reset,
			commitHistory,
			buildSaveModifiers,
			exportImageEdit: exportSessionImageEdit,
		} ),
		[
			adjustments,
			areAdjustmentsDirty,
			cropper,
			commitHistory,
			exportSessionImageEdit,
			hasReplacementImageEdits,
			hasAdjustmentsRedo,
			hasAdjustmentsUndo,
			redo,
			reset,
			resetAdjustments,
			setAdjustment,
			setSourceImage,
			sessionCropper,
			sourceImage,
			undo,
			workingImage,
			buildSaveModifiers,
		]
	);

	return (
		<ImageEditingSessionContext.Provider value={ session }>
			<CropperProvider value={ sessionCropper }>
				{ children }
			</CropperProvider>
		</ImageEditingSessionContext.Provider>
	);
}

export function useImageEditingSession(): ImageEditingSession {
	const context = useContext( ImageEditingSessionContext );
	if ( ! context ) {
		throw new Error(
			'useImageEditingSession must be used within ImageEditingSessionProvider.'
		);
	}
	return context;
}
