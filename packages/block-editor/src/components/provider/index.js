/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { SlotFillProvider } from '@wordpress/components';
import {
	MediaUploadProvider,
	store as uploadStore,
	canProcessWithVips,
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
 * Upload a media file when the file upload button is activated
 * or when adding a file to the editor via drag & drop.
 *
 * Files are split based on whether they can be processed client-side.
 * Supported formats (images like JPEG, PNG, WebP, etc.) go through
 * client-side processing, while unsupported formats (like PDFs)
 * are passed directly to the server-side upload.
 *
 * @param {WPDataRegistry} registry
 * @param {Function}       serverMediaUpload The original server-side media upload function.
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
	serverMediaUpload,
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
	// Split files into those that can be processed client-side and those that cannot.
	const clientSideFiles = [];
	const serverSideFiles = [];

	for ( const file of filesList ) {
		if ( canProcessWithVips( file ) ) {
			clientSideFiles.push( file );
		} else {
			serverSideFiles.push( file );
		}
	}

	// Process supported files using client-side media processing.
	if ( clientSideFiles.length > 0 ) {
		void registry.dispatch( uploadStore ).addItems( {
			files: clientSideFiles,
			onChange: onFileChange,
			onSuccess,
			onBatchSuccess,
			onError: ( { message } ) => onError( message ),
			additionalData,
			allowedTypes,
		} );
	}

	// Process unsupported files using server-side upload.
	if ( serverSideFiles.length > 0 ) {
		serverMediaUpload( {
			allowedTypes,
			additionalData,
			filesList: serverSideFiles,
			onError,
			onFileChange,
			onSuccess,
		} );
	}
}

export const ExperimentalBlockEditorProvider = withRegistryProvider(
	( props ) => {
		const {
			settings: _settings,
			registry,
			stripExperimentalSettings = false,
		} = props;

		const mediaUploadSettings = useMediaUploadSettings( _settings );

		const settings = useMemo( () => {
			if (
				window.__experimentalMediaProcessing &&
				_settings?.mediaUpload
			) {
				// Create a new object so that the original props.settings.mediaUpload is not modified.
				// Pass the original mediaUpload for server-side fallback of unsupported formats.
				return {
					..._settings,
					mediaUpload: mediaUpload.bind(
						null,
						registry,
						_settings.mediaUpload
					),
				};
			}
			return _settings;
		}, [ _settings, registry ] );

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

		if ( window.__experimentalMediaProcessing ) {
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
