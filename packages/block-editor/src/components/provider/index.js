/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { SlotFillProvider } from '@wordpress/components';
//eslint-disable-next-line import/no-extraneous-dependencies -- Experimental package, not published.
import { MediaUploadProvider } from '@wordpress/upload-media';

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

/** @typedef {import('@wordpress/data').WPDataRegistry} WPDataRegistry */

export const ExperimentalBlockEditorProvider = withRegistryProvider(
	( props ) => {
		const { children, settings, stripExperimentalSettings = false } = props;

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

		const mediaUploadSettings = useMediaUploadSettings( settings );

		if ( window.__experimentalMediaProcessing ) {
			return (
				<MediaUploadProvider
					settings={ mediaUploadSettings }
					useSubRegistry={ false }
				>
					<SlotFillProvider passthrough>
						{ ! settings?.__unstableIsPreviewMode && (
							<KeyboardShortcuts.Register />
						) }
						<BlockRefsProvider>{ children }</BlockRefsProvider>
					</SlotFillProvider>
				</MediaUploadProvider>
			);
		}

		return (
			<SlotFillProvider passthrough>
				{ ! settings?.isPreviewMode && <KeyboardShortcuts.Register /> }
				<BlockRefsProvider>{ children }</BlockRefsProvider>
			</SlotFillProvider>
		);
	}
);

export const BlockEditorProvider = ( props ) => {
	return (
		<ExperimentalBlockEditorProvider { ...props } stripExperimentalSettings>
			{ props.children }
		</ExperimentalBlockEditorProvider>
	);
};

export default BlockEditorProvider;
