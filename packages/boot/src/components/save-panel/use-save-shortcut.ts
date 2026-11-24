import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
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

	/*
	 * An editor canvas that is not a preview registers the editor's own save
	 * shortcut, which takes over while it is shown, as in the site editor.
	 */
	const hasEditorCanvas = !! canvas && ! canvas.isPreview;

	useShortcut(
		shortcutName,
		( event: Event ) => {
			event.preventDefault();
			const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
			const hasDirtyEntities = !! dirtyEntityRecords.length;
			const isSaving = dirtyEntityRecords.some( ( record ) =>
				isSavingEntityRecord( record.kind, record.name, record.key )
			);
			if ( ! hasDirtyEntities || isSaving ) {
				return;
			}
			openSavePanel();
		},
		{ isDisabled: hasEditorCanvas }
	);
}
