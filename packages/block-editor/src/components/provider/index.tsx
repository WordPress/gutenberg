import { useDispatch } from '@wordpress/data';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { SlotFillProvider } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	MediaUploadProvider,
	store as uploadStore,
	detectClientSideMediaSupport,
	isHeicCanvasSupported,
	isHeicFile,
} from '@wordpress/upload-media';
import type { DataRegistry } from '@wordpress/data';
import withRegistryProvider from './with-registry-provider';
import useBlockSync from './use-block-sync';
import { store as blockEditorStore } from '../../store';
import { BlockRefsProvider } from './block-refs-provider';
import { unlock } from '../../lock-unlock';
import KeyboardShortcuts from '../keyboard-shortcuts';
import BlockKeyboardShortcuts from '../block-keyboard-shortcuts';
import useMediaUploadSettings from './use-media-upload-settings';
import { mediaUploadOnSuccessKey } from '../../store/private-keys';
import { SelectionContext } from './selection-context';
import type { Settings } from '../../store/types';
import type {
	BlockEditorProviderProps,
	BlockSelectionState,
	MediaUploadFunction,
	MediaUploadOptions,
	RegistryProvidedProps,
	UseBlockSyncProps,
} from './types';

const noop = () => {};

/**
 * Flag to track if we've already logged the fallback message.
 */
let hasLoggedFallback = false;

/**
 * Cached result of whether client-side media processing should be enabled.
 * This is computed once per session for efficiency and stability.
 */
let isClientSideMediaEnabledCache: boolean | null = null;

/**
 * Cached result of whether HEIC-only canvas processing should be enabled.
 */
let isHeicCanvasEnabledCache: boolean | null = null;

/**
 * Refuses a batch of more than one file on behalf of a caller that only takes
 * one - a Cover block's placeholder, say.
 *
 * `uploadMedia()` in `@wordpress/media-utils` refuses such a batch with the
 * same wording, but the `@wordpress/upload-media` pipeline below is a separate
 * transport that never reaches that function. Without this check every dropped
 * file uploads and the caller keeps whichever one lands last (gutenberg#82041).
 *
 * @param filesList List of files.
 * @param multiple  Whether the caller accepts more than one file.
 * @param onError   Function called when an error happens.
 *
 * @return Whether the batch was refused.
 */
function refuseExtraFiles(
	filesList: ArrayLike< File >,
	multiple: boolean,
	onError: ( message: string ) => void
): boolean {
	if ( ! multiple && filesList.length > 1 ) {
		onError( __( 'Only one file can be used here.' ) );
		return true;
	}

	return false;
}

/**
 * Checks if client-side media processing should be enabled.
 *
 * Returns true only if:
 * 1. The client-side media processing flag is enabled
 * 2. The browser supports WebAssembly, SharedArrayBuffer, cross-origin isolation, and CSP allows blob workers
 *
 * The result is cached for the session to ensure stability during React renders.
 *
 * @return Whether client-side media processing should be enabled.
 */
function shouldEnableClientSideMediaProcessing(): boolean {
	// Return cached result if available.
	if ( isClientSideMediaEnabledCache !== null ) {
		return isClientSideMediaEnabledCache;
	}

	// Check if the client-side media processing flag is enabled first.
	if ( ! window.__clientSideMediaProcessing ) {
		isClientSideMediaEnabledCache = false;
		return false;
	}

	// Safety check in case the import is unavailable.
	if ( typeof detectClientSideMediaSupport !== 'function' ) {
		isClientSideMediaEnabledCache = false;
		return false;
	}

	const detection = detectClientSideMediaSupport();
	if ( ! detection || ! detection.supported ) {
		// Only log once per session to avoid console spam.
		if ( ! hasLoggedFallback ) {
			// eslint-disable-next-line no-console
			console.info(
				`Client-side media processing unavailable: ${ detection.reason }. Using server-side processing.`
			);
			hasLoggedFallback = true;
		}
		isClientSideMediaEnabledCache = false;
		return false;
	}

	isClientSideMediaEnabledCache = true;
	return true;
}

/**
 * Checks if HEIC-only canvas processing should be enabled.
 *
 * Returns true when:
 * 1. Full client-side processing is NOT available (otherwise it handles HEIC already)
 * 2. The server has set the __clientSideMediaProcessing flag
 * 3. The browser supports createImageBitmap + OffscreenCanvas (e.g. Safari)
 *
 * @return Whether HEIC-only canvas processing should be enabled.
 */
function shouldEnableHeicCanvasProcessing(): boolean {
	if ( isHeicCanvasEnabledCache !== null ) {
		return isHeicCanvasEnabledCache;
	}

	// If full client-side processing is enabled, it already handles HEIC.
	if ( shouldEnableClientSideMediaProcessing() ) {
		isHeicCanvasEnabledCache = false;
		return false;
	}

	if ( ! window.__clientSideMediaProcessing ) {
		isHeicCanvasEnabledCache = false;
		return false;
	}

	if (
		typeof isHeicCanvasSupported !== 'function' ||
		! isHeicCanvasSupported()
	) {
		isHeicCanvasEnabledCache = false;
		return false;
	}

	isHeicCanvasEnabledCache = true;
	return true;
}

type AttachmentRecord = Record< string, unknown >;

/**
 * Coordinates slot-based `onFileChange` and `onBatchSuccess` callbacks across a
 * batch of files uploaded individually through `@wordpress/upload-media`.
 *
 * Each file receives a fixed slot index so `onFileChange` always receives all
 * active attachments in original file order, failed files clear their slot and
 * trigger `onFileChange`, and `onBatchSuccess` fires once after all files have
 * settled (provided at least one succeeded).
 *
 * @param totalFiles     Number of files in the batch.
 * @param onFileChange   Callback invoked with active attachments in file order.
 * @param onBatchSuccess Callback invoked once after the batch settles.
 * @return Slot update and settlement helpers.
 */
function createBatchUploadTracker(
	totalFiles: number,
	onFileChange?: ( attachments: Array< AttachmentRecord > ) => void,
	onBatchSuccess?: () => void
) {
	const slots: Array< AttachmentRecord | null > = new Array(
		totalFiles
	).fill( null );
	const settled: boolean[] = new Array( totalFiles ).fill( false );
	let remaining = totalFiles;
	let hasSuccess = false;

	const updateSlot = ( index: number, value: AttachmentRecord | null ) => {
		slots[ index ] = value;
		onFileChange?.(
			slots.filter(
				( attachment ): attachment is AttachmentRecord =>
					attachment !== null
			)
		);
	};

	const settleSlot = ( index: number, succeeded: boolean ) => {
		if ( settled[ index ] ) {
			return;
		}
		settled[ index ] = true;
		if ( succeeded ) {
			hasSuccess = true;
		}
		remaining--;
		if ( remaining === 0 && hasSuccess ) {
			onBatchSuccess?.();
		}
	};

	return {
		updateSlot,
		settleSlot,
	};
}

/**
 * Enqueues a single file into the `@wordpress/upload-media` store while updating
 * its corresponding batch slot.
 *
 * @param registry          The data registry.
 * @param settings          Block editor settings.
 * @param $3                Upload item parameters.
 * @param $3.file           File to upload.
 * @param $3.index          Slot index in the original batch.
 * @param $3.tracker        Batch upload tracker.
 * @param $3.allowedTypes   Allowed media types.
 * @param $3.additionalData Additional request data.
 * @param $3.onError        Error callback.
 * @param $3.onSuccess      Per-file success callback.
 */
function enqueueUploadItem(
	registry: DataRegistry,
	settings: Settings,
	{
		file,
		index,
		tracker,
		allowedTypes,
		additionalData,
		onError,
		onSuccess,
	}: {
		file: File;
		index: number;
		tracker: ReturnType< typeof createBatchUploadTracker >;
		allowedTypes?: string[];
		additionalData: Record< string, unknown >;
		onError: ( message: string ) => void;
		onSuccess?: ( attachments: Array< AttachmentRecord > ) => void;
	}
) {
	void registry.dispatch( uploadStore ).addItems( {
		files: [ file ],
		onChange: ( [ attachment ] ) => {
			tracker.updateSlot(
				index,
				( attachment as AttachmentRecord ) ?? null
			);
		},
		onSuccess: ( attachments ) => {
			// The private success callback takes the attachments.
			(
				settings?.[ mediaUploadOnSuccessKey ] as
					( ( attachments: unknown ) => void ) | undefined
			 )?.( attachments );
			onSuccess?.( attachments as Array< AttachmentRecord > );
		},
		onBatchSuccess: () => tracker.settleSlot( index, true ),
		onError: ( error ) => {
			tracker.updateSlot( index, null );
			onError(
				typeof error === 'string' ? error : ( error?.message ?? '' )
			);
			tracker.settleSlot( index, false );
		},
		additionalData,
		allowedTypes,
	} );
}

/**
 * Upload a media file when the file upload button is activated
 * or when adding a file to the editor via drag & drop.
 *
 * @param registry          The data registry.
 * @param settings          Block editor settings.
 * @param $3                Parameters object passed to the function.
 * @param $3.allowedTypes   Array with the types of media that can be uploaded, if unset all types are allowed.
 * @param $3.additionalData Additional data to include in the request.
 * @param $3.filesList      List of files.
 * @param $3.onError        Function called when an error happens.
 * @param $3.onFileChange   Function called each time a file or a temporary representation of the file is available.
 * @param $3.onSuccess      Function called once a file has completely finished uploading, including thumbnails.
 * @param $3.onBatchSuccess Function called once all files in a group have completely finished uploading, including thumbnails.
 * @param $3.multiple       Whether the caller accepts more than one file.
 */
export function mediaUpload(
	registry: DataRegistry,
	settings: Settings,
	{
		allowedTypes,
		additionalData = {},
		filesList,
		onError = noop,
		onFileChange,
		onSuccess,
		onBatchSuccess,
		multiple = true,
	}: MediaUploadOptions
) {
	if ( refuseExtraFiles( filesList, multiple, onError ) ) {
		return;
	}

	const files = Array.from( filesList );
	if ( files.length === 0 ) {
		return;
	}

	const tracker = createBatchUploadTracker(
		files.length,
		onFileChange,
		onBatchSuccess
	);

	files.forEach( ( file, index ) => {
		enqueueUploadItem( registry, settings, {
			file,
			index,
			tracker,
			allowedTypes,
			additionalData,
			onError,
			onSuccess,
		} );
	} );
}

/**
 * Upload interceptor for HEIC-only mode.
 *
 * Routes HEIC files through the upload-media pipeline for canvas-based
 * conversion, while passing non-HEIC files to the original mediaUpload
 * function for standard server-side processing.
 *
 * @param registry          The data registry.
 * @param settings          Block editor settings.
 * @param $3                Parameters object passed to the function.
 * @param $3.allowedTypes   Array with the types of media that can be uploaded, if unset all types are allowed.
 * @param $3.additionalData Additional data to include in the request.
 * @param $3.filesList      List of files.
 * @param $3.onError        Function called when an error happens.
 * @param $3.onFileChange   Function called each time a file or a temporary representation of the file is available.
 * @param $3.onSuccess      Function called once a file has completely finished uploading, including thumbnails.
 * @param $3.onBatchSuccess Function called once all files in a group have completely finished uploading, including thumbnails.
 * @param $3.multiple       Whether the caller accepts more than one file.
 */
export async function heicMediaUpload(
	registry: DataRegistry,
	settings: Settings,
	{
		allowedTypes,
		additionalData = {},
		filesList,
		onError = noop,
		onFileChange,
		onSuccess,
		onBatchSuccess,
		multiple = true,
	}: MediaUploadOptions
) {
	if ( refuseExtraFiles( filesList, multiple, onError ) ) {
		return;
	}

	const files = Array.from( filesList );
	if ( files.length === 0 ) {
		return;
	}

	/*
	 * Sorted by content rather than by `File.type`, which a browser derives
	 * from the file extension: a HEIC photo saved as .jpg would otherwise be
	 * handed to the server-side path, which cannot convert it either.
	 */
	const heicEntries: Array< { file: File; index: number } > = [];
	const otherEntries: Array< { file: File; index: number } > = [];
	for ( let index = 0; index < files.length; index++ ) {
		const file = files[ index ];
		( ( await isHeicFile( file ) ) ? heicEntries : otherEntries ).push( {
			file,
			index,
		} );
	}

	if ( heicEntries.length === 0 && settings?.mediaUpload ) {
		( settings.mediaUpload as MediaUploadFunction )( {
			allowedTypes,
			additionalData,
			filesList,
			onError,
			onFileChange,
			onSuccess,
			onBatchSuccess,
			multiple,
		} );
		return;
	}

	const totalFiles =
		heicEntries.length +
		( settings?.mediaUpload ? otherEntries.length : 0 );
	const tracker = createBatchUploadTracker(
		totalFiles,
		onFileChange,
		onBatchSuccess
	);

	// Route HEIC files through the upload-media pipeline.
	heicEntries.forEach( ( { file, index }, heicPosition ) => {
		const slotIndex = settings?.mediaUpload ? index : heicPosition;
		enqueueUploadItem( registry, settings, {
			file,
			index: slotIndex,
			tracker,
			allowedTypes,
			additionalData,
			onError,
			onSuccess,
		} );
	} );

	// Pass non-HEIC files to the original server-side upload function.
	if ( otherEntries.length > 0 && settings?.mediaUpload ) {
		const originalMediaUpload = settings.mediaUpload as MediaUploadFunction;
		otherEntries.forEach( ( { file, index } ) => {
			originalMediaUpload( {
				allowedTypes,
				additionalData,
				filesList: [ file ],
				onError: ( error ) => {
					tracker.updateSlot( index, null );
					onError( error );
					tracker.settleSlot( index, false );
				},
				onFileChange: ( [ attachment ] ) => {
					tracker.updateSlot( index, attachment ?? null );
				},
				onSuccess: ( attachments ) => {
					onSuccess?.( attachments );
					tracker.settleSlot( index, true );
				},
				onBatchSuccess: () => tracker.settleSlot( index, true ),
				multiple,
			} );
		} );
	}
}

/**
 * Calls useBlockSync as a child of SelectionContext.Provider so that the
 * hook can read selection state from the context provided by this tree
 * rather than from a parent provider (which may not exist for the root).
 *
 * @param props Props forwarded to useBlockSync.
 */
function BlockSyncEffect( props: UseBlockSyncProps ) {
	useBlockSync( props );
	return null;
}

export const ExperimentalBlockEditorProvider = withRegistryProvider(
	( props: RegistryProvidedProps ) => {
		const {
			settings: _settings,
			registry,
			stripExperimentalSettings = false,
		} = props;

		const mediaUploadSettings = useMediaUploadSettings( _settings );

		const isClientSideMediaEnabled =
			shouldEnableClientSideMediaProcessing();
		const isHeicCanvasEnabled = shouldEnableHeicCanvasProcessing();
		const useUploadMediaPipeline =
			isClientSideMediaEnabled || isHeicCanvasEnabled;

		// Nested providers (e.g. from useBlockPreview) inherit settings
		// where mediaUpload has already been replaced with the
		// interceptor.  Detect this so we skip the replacement and
		// MediaUploadProvider for them — see the longer comment below.
		const isMediaUploadIntercepted = !! (
			_settings?.mediaUpload as MediaUploadFunction | undefined
		 )?.__isMediaUploadInterceptor;

		const settings = useMemo( () => {
			if (
				useUploadMediaPipeline &&
				_settings?.mediaUpload &&
				! isMediaUploadIntercepted
			) {
				// Choose the right interceptor:
				// - Full mode: all uploads go through upload-media pipeline.
				// - HEIC-only mode: only HEIC files go through, rest use legacy path.
				const uploadFn = isClientSideMediaEnabled
					? mediaUpload
					: heicMediaUpload;
				// The bound upload function gets flagged as the interceptor.
				const interceptor = uploadFn.bind(
					null,
					registry,
					_settings!
				) as MediaUploadFunction;
				interceptor.__isMediaUploadInterceptor = true;
				return {
					..._settings,
					mediaUpload: interceptor,
				};
			}
			return _settings;
		}, [
			_settings,
			registry,
			useUploadMediaPipeline,
			isClientSideMediaEnabled,
			isMediaUploadIntercepted,
		] );

		const { __experimentalUpdateSettings } = unlock(
			useDispatch( blockEditorStore )
		);
		useEffect( () => {
			__experimentalUpdateSettings(
				{
					...settings,
					__internalIsInitialized: true,
				},
				{
					stripExperimentalSettings,
					reset: true,
				}
			);
		}, [
			settings,
			stripExperimentalSettings,
			__experimentalUpdateSettings,
		] );

		// Store selection and onChangeSelection in refs and expose
		// stable getters/callers so that the context value is a
		// complete constant.  This prevents re-rendering the entire
		// block tree (including async-rendered off-screen blocks)
		// when either value changes.
		const selectionRef = useRef( props.selection );
		selectionRef.current = props.selection;
		const onChangeSelectionRef = useRef( props.onChangeSelection ?? noop );
		onChangeSelectionRef.current = props.onChangeSelection ?? noop;

		const selectionContextValue = useMemo(
			() => ( {
				getSelection: () => selectionRef.current,
				onChangeSelection: ( ...args: [ BlockSelectionState ] ) =>
					onChangeSelectionRef.current( ...args ),
			} ),
			[]
		);

		const children = (
			<SlotFillProvider passthrough>
				{ ! settings?.isPreviewMode && (
					<>
						<KeyboardShortcuts.Register />
						<BlockKeyboardShortcuts />
					</>
				) }
				<BlockRefsProvider>{ props.children }</BlockRefsProvider>
			</SlotFillProvider>
		);

		const content = (
			<SelectionContext.Provider value={ selectionContextValue }>
				<BlockSyncEffect
					clientId={ props.clientId }
					value={ props.value }
					onChange={ props.onChange }
					onInput={ props.onInput }
				/>
				{ children }
			</SelectionContext.Provider>
		);

		// MediaUploadProvider writes the mediaUpload function from
		// _settings into the shared upload-media store so the store can
		// hand files off to the server. useMediaUploadSettings extracts
		// mediaUpload from the original _settings prop — *before* the
		// interceptor replacement above — so the store receives the
		// real server-side upload function.
		//
		// Only the first (outermost) provider should do this.
		// Nested providers (e.g. from useBlockPreview in
		// core/post-template) inherit settings that already contain
		// the interceptor, so their MediaUploadProvider would
		// overwrite the store's server-side function with the
		// interceptor, causing uploads to loop instead of reaching
		// the server.
		if ( useUploadMediaPipeline && ! isMediaUploadIntercepted ) {
			return (
				<MediaUploadProvider
					settings={ mediaUploadSettings }
					useSubRegistry={ false }
				>
					{ content }
				</MediaUploadProvider>
			);
		}

		return content;
	}
);

export const BlockEditorProvider = ( props: BlockEditorProviderProps ) => {
	return (
		<ExperimentalBlockEditorProvider { ...props } stripExperimentalSettings>
			{ props.children }
		</ExperimentalBlockEditorProvider>
	);
};

export default BlockEditorProvider;
