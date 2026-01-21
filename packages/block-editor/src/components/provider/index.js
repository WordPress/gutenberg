/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { SlotFillProvider } from '@wordpress/components';
import {
	MediaUploadProvider,
	store as uploadStore,
	detectClientSideMediaSupport,
} from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import useBlockSync from './use-block-sync';
import { store as blockEditorStore } from '../../store';
import { BlockRefsProvider } from './block-refs-provider';
import { unlock } from '../../lock-unlock';
import KeyboardShortcuts from '../keyboard-shortcuts';
import useMediaUploadSettings from './use-media-upload-settings';
import useUploadSaveLock from './use-upload-save-lock';

/** @typedef {import('@wordpress/data').WPDataRegistry} WPDataRegistry */

const noop = () => {};

/**
 * Flag to track if we've already logged the fallback message.
 */
let hasLoggedFallback = false;

/**
 * Checks if client-side media processing should be enabled.
 *
 * Returns true only if:
 * 1. The experimental media processing flag is enabled
 * 2. The browser supports WebAssembly, SharedArrayBuffer, and cross-origin isolation
 *
 * @return {boolean} Whether client-side media processing should be enabled.
 */
function shouldEnableClientSideMediaProcessing() {
	if ( ! window.__experimentalMediaProcessing ) {
		return false;
	}

	const detection = detectClientSideMediaSupport();
	if ( ! detection.supported ) {
		// Only log once per session to avoid console spam.
		if ( ! hasLoggedFallback ) {
			// eslint-disable-next-line no-console
			console.info(
				`Client-side media processing unavailable: ${ detection.reason }. Using server-side processing.`
			);
			hasLoggedFallback = true;
		}
		return false;
	}

	return true;
}

/**
 * Upload a media file when the file upload button is activated
 * or when adding a file to the editor via drag & drop.
 *
 * @param {WPDataRegistry} registry
 * @param {Object}         $3                Parameters object passed to the function.
 * @param {Array}          $3.allowedTypes   Array with the types of media that can be uploaded, if unset all types are allowed.
 * @param {Object}         $3.additionalData Additional data to include in the request.
 * @param {Array<File>}    $3.filesList      List of files.
 * @param {Function}       $3.onError        Function called when an error happens.
 * @param {Function}       $3.onFileChange   Function called each time a file or a temporary representation of the file is available.
 * @param {Function}       $3.onSuccess      Function called once a file has completely finished uploading, including thumbnails.
 * @param {Function}       $3.onBatchSuccess Function called once all files in a group have completely finished uploading, including thumbnails.
 */
function mediaUpload(
	registry,
	{
		allowedTypes,
		additionalData = {},
		filesList,
		onError = noop,
		onFileChange,
		onSuccess,
		onBatchSuccess,
	}
) {
	void registry.dispatch( uploadStore ).addItems( {
		files: Array.from( filesList ),
		onChange: onFileChange,
		onSuccess,
		onBatchSuccess,
		onError: ( { message } ) => onError( message ),
		additionalData,
		allowedTypes,
	} );
}

export const ExperimentalBlockEditorProvider = withRegistryProvider(
	( props ) => {
		const {
			settings: _settings,
			registry,
			stripExperimentalSettings = false,
		} = props;

		const mediaUploadSettings = useMediaUploadSettings( _settings );

		const isClientSideMediaEnabled =
			shouldEnableClientSideMediaProcessing();

		const settings = useMemo( () => {
			if ( isClientSideMediaEnabled && _settings?.mediaUpload ) {
				// Create a new object so that the original props.settings.mediaUpload is not modified.
				return {
					..._settings,
					mediaUpload: mediaUpload.bind( null, registry ),
				};
			}
			return _settings;
		}, [ _settings, registry, isClientSideMediaEnabled ] );

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

		// Syncs the entity provider with changes in the block-editor store.
		useBlockSync( props );

		const children = (
			<SlotFillProvider passthrough>
				{ ! settings?.isPreviewMode && <KeyboardShortcuts.Register /> }
				<BlockRefsProvider>{ props.children }</BlockRefsProvider>
			</SlotFillProvider>
		);

		if ( isClientSideMediaEnabled ) {
			return (
				<MediaUploadProvider
					settings={ mediaUploadSettings }
					useSubRegistry={ false }
				>
					<UploadSaveLockWrapper>{ children }</UploadSaveLockWrapper>
				</MediaUploadProvider>
			);
		}

		return children;
	}
);

/**
 * Wrapper component that manages post save locks based on upload state.
 * Must be rendered inside MediaUploadProvider to access the upload-media store.
 *
 * @param {Object} props          Component props.
 * @param {Object} props.children Children elements.
 */
function UploadSaveLockWrapper( { children } ) {
	useUploadSaveLock();
	return children;
}

export const BlockEditorProvider = ( props ) => {
	return (
		<ExperimentalBlockEditorProvider { ...props } stripExperimentalSettings>
			{ props.children }
		</ExperimentalBlockEditorProvider>
	);
};

export default BlockEditorProvider;
