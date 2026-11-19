import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { unlock } from '../../lock-unlock';
import type { CanvasData } from '../../store/types';

const { useMatches } = unlock( routePrivateApis );

const shortcutName = 'core/boot/save';

/**
 * Register the save keyboard shortcut in view mode.
 *
 * @param param0               Object containing the function to open the save panel.
 * @param param0.openSavePanel Function to open the save panel.
 */
export default function useSaveShortcut( {
	openSavePanel,
}: {
	openSavePanel: () => void;
} ) {
	const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
		useSelect( coreStore );
	const registry = useRegistry();
	const matches = useMatches();
	const canvas = ( matches[ matches.length - 1 ]?.loaderData as any )
		?.canvas as CanvasData | null | undefined;
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);
	useEffect( () => {
		registerShortcut( {
			name: shortcutName,
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );
		return () => {
			unregisterShortcut( shortcutName );
		};
	}, [ registerShortcut, unregisterShortcut ] );

	useShortcut( shortcutName, ( event: Event ) => {
		event.preventDefault();
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		const hasDirtyEntities = !! dirtyEntityRecords.length;
		const isSaving = dirtyEntityRecords.some( ( record ) =>
			isSavingEntityRecord( record.kind, record.name, record.key )
		);
		if ( ! hasDirtyEntities || isSaving ) {
			return;
		}

		/*
		 * An editor canvas that is not a preview handles the same shortcut
		 * itself, and saves the post it shows unless saving is locked. When
		 * that post is the only change, leave it to the editor. The post is the
		 * one the canvas names, or the homepage when it names none, as the
		 * editor resolves it.
		 */
		if ( canvas && ! canvas.isPreview ) {
			const homePage =
				canvas.postType || canvas.postId
					? null
					: ( unlock(
							registry.select( coreStore )
						).getHomePage() as {
							postType?: string;
							postId?: string;
						} | null );
			const postType = canvas.postType || homePage?.postType;
			const postId = canvas.postId || homePage?.postId;
			const hasOnlyPostChanges = dirtyEntityRecords.every(
				( record ) =>
					record.kind === 'postType' &&
					record.name === postType &&
					String( record.key ) === String( postId )
			);
			if ( hasOnlyPostChanges ) {
				return;
			}
		}

		openSavePanel();
	} );
}
