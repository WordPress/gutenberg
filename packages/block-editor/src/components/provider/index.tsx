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
function mediaUpload(
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

	void registry.dispatch( uploadStore ).addItems( {
		files: Array.from( filesList ),
		onChange: onFileChange,
		onSuccess: ( attachments ) => {
			// The private success callback takes the attachments.
			(
				settings?.[ mediaUploadOnSuccessKey ] as
					( ( attachments: unknown ) => void ) | undefined
			 )?.( attachments );
			onSuccess?.( attachments );
		},
		onBatchSuccess,
		onError: ( error ) =>
			onError(
				typeof error === 'string' ? error : ( error?.message ?? '' )
			),
		additionalData,
		allowedTypes,
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
async function heicMediaUpload(
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

	/*
	 * Sorted by content rather than by `File.type`, which a browser derives
	 * from the file extension: a HEIC photo saved as .jpg would otherwise be
	 * handed to the server-side path, which cannot convert it either.
	 */
	const heicFiles: File[] = [];
	const otherFiles: File[] = [];
	for ( const file of files ) {
		( ( await isHeicFile( file ) ) ? heicFiles : otherFiles ).push( file );
	}

	// When the batch contains both HEIC and non-HEIC files, coordinate
	// onBatchSuccess so it fires only after *both* paths have completed.
	const hasBothPaths =
		heicFiles.length > 0 && otherFiles.length > 0 && settings?.mediaUpload;
	let pathsRemaining = hasBothPaths ? 2 : 1;
	const coordinatedBatchSuccess = hasBothPaths
		? () => {
				pathsRemaining--;
				if ( pathsRemaining <= 0 ) {
					onBatchSuccess?.();
				}
			}
		: onBatchSuccess;

	// Route HEIC files through the upload-media pipeline.
	if ( heicFiles.length > 0 ) {
		void registry.dispatch( uploadStore ).addItems( {
			files: heicFiles,
			onChange: onFileChange,
			onSuccess: ( attachments ) => {
				// The private success callback takes the attachments.
				(
					settings?.[ mediaUploadOnSuccessKey ] as
						( ( attachments: unknown ) => void ) | undefined
				 )?.( attachments );
				onSuccess?.( attachments );
			},
			onBatchSuccess: coordinatedBatchSuccess,
			onError: ( error ) =>
				onError(
					typeof error === 'string' ? error : ( error?.message ?? '' )
				),
			additionalData,
			allowedTypes,
		} );
	}

	// Pass non-HEIC files to the original server-side upload function.
	if ( otherFiles.length > 0 && settings?.mediaUpload ) {
		// The setting is the server-side upload function.
		( settings.mediaUpload as MediaUploadFunction )( {
			allowedTypes,
			additionalData,
			filesList: otherFiles,
			onError,
			onFileChange,
			onSuccess,
			onBatchSuccess: coordinatedBatchSuccess,
			multiple,
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
