import { speak } from '@wordpress/a11y';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __experimentalUseSlot as useSlot } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useLayoutEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import NotesMoreMenuGroup from '../more-menu/notes-more-menu-group';
import MoreMenuSubmenu from '../more-menu/more-menu-submenu';
import { ALL_NOTES_SIDEBAR } from './constants';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import { CanvasMargin, FULL_TIER } from '../visual-editor/canvas-margin';

const DISPLAY_MODES = [ 'full', 'minimized', 'hidden' ] as const;

type NotesDisplayMode = ( typeof DISPLAY_MODES )[ number ];

type NotesDisplayModeMenuProps = {
	/**
	 * Whether there are floating notes to show.
	 */
	hasFloatingNotes: boolean;

	/**
	 * Whether the "All notes" sidebar is available.
	 */
	hasAllNotes: boolean;
};

type DisplayModeItemsProps = {
	displayMode: NotesDisplayMode;
	onChange: ( mode: NotesDisplayMode ) => void;
};

/**
 * Returns the room the canvas has for the notes margin, following the canvas
 * width. It's meant for UI that mounts briefly, like a menu.
 */
function useCanvasMarginRoom() {
	const { ref } = useSlot( CanvasMargin.name );
	const [ room, setRoom ] = useState< 'full' | 'compact' | 'none' >( 'full' );

	useLayoutEffect( () => {
		const slot = ref?.current;
		// The canvas iframe resizes with its box, whether the window or a
		// sidebar moves it.
		const view = slot?.parentElement?.querySelector< HTMLIFrameElement >(
			'iframe[name="editor-canvas"]'
		)?.contentWindow;
		function update() {
			// Safari < 17.4 lacks `checkVisibility`.
			if ( ! slot || slot.checkVisibility?.() === false ) {
				setRoom( 'none' );
			} else {
				// The slot's parent is the box its container queries measure.
				setRoom(
					( slot.parentElement?.clientWidth ?? 0 ) >=
						FULL_TIER.minCanvasWidth
						? 'full'
						: 'compact'
				);
			}
		}
		update();
		view?.addEventListener( 'resize', update );
		return () => view?.removeEventListener( 'resize', update );
	}, [ ref ] );

	return room;
}

/**
 * Renders the display modes, disabling the ones the canvas has no room for.
 * It mounts with the submenu, so the room is read only while it's open.
 *
 * @param props             Component props.
 * @param props.displayMode The display mode preference.
 * @param props.onChange    Called with the chosen display mode.
 */
function DisplayModeItems( { displayMode, onChange }: DisplayModeItemsProps ) {
	const room = useCanvasMarginRoom();
	const { isZoomedOut, isDevicePreview } = useSelect( ( select ) => {
		return {
			isZoomedOut: unlock( select( blockEditorStore ) ).isZoomOut(),
			isDevicePreview:
				select( editorStore ).getDeviceType() !== 'Desktop',
		};
	}, [] );

	let reason: string = __( 'Not enough space.' );
	if ( isZoomedOut ) {
		reason = __( 'Not available in zoom out.' );
	} else if ( isDevicePreview ) {
		reason = __( 'Not available in device preview.' );
	}
	// Show the mode the canvas has room for; the preference stays.
	const value =
		displayMode === 'full' && room === 'compact'
			? 'minimized'
			: displayMode;

	return (
		<Menu.RadioGroup value={ value } onValueChange={ onChange }>
			<Menu.RadioItem value="full" disabled={ room !== 'full' }>
				<Menu.ItemLabel>{ __( 'Expand notes' ) }</Menu.ItemLabel>
				{ room !== 'full' && (
					<Menu.ItemDescription>{ reason }</Menu.ItemDescription>
				) }
			</Menu.RadioItem>
			<Menu.RadioItem value="minimized" disabled={ room === 'none' }>
				<Menu.ItemLabel>{ __( 'Minimize notes' ) }</Menu.ItemLabel>
				{ room === 'none' && (
					<Menu.ItemDescription>{ reason }</Menu.ItemDescription>
				) }
			</Menu.RadioItem>
			<Menu.RadioItem value="hidden">
				<Menu.ItemLabel>{ __( 'Hide notes' ) }</Menu.ItemLabel>
			</Menu.RadioItem>
		</Menu.RadioGroup>
	);
}

/**
 * Renders the "Notes" submenu of the editor's Options menu, which shows or
 * hides the floating notes and toggles the "All notes" sidebar.
 *
 * @param props                  Component props.
 * @param props.hasFloatingNotes Whether there are floating notes to show.
 * @param props.hasAllNotes      Whether the "All notes" sidebar is available.
 */
export function NotesDisplayModeMenu( {
	hasFloatingNotes,
	hasAllNotes,
}: NotesDisplayModeMenuProps ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const { displayMode, isAllNotesOpen } = useSelect( ( select ) => {
		const mode = select( preferencesStore ).get(
			'core',
			'notesDisplayMode'
		);
		return {
			displayMode: DISPLAY_MODES.includes( mode ) ? mode : 'full',
			isAllNotesOpen:
				select( interfaceStore ).getActiveComplementaryArea(
					'core'
				) === ALL_NOTES_SIDEBAR,
		};
	}, [] );
	const { set: setPreference } = useDispatch( preferencesStore );
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );

	if ( ! isLargeViewport && ! hasAllNotes ) {
		return null;
	}

	function setDisplayMode( mode: NotesDisplayMode ) {
		setPreference( 'core', 'notesDisplayMode', mode );
		// Floating notes yield to "All notes", so showing them closes it.
		if ( mode !== 'hidden' && hasFloatingNotes && isAllNotesOpen ) {
			disableComplementaryArea( 'core' );
		}
		const messages = {
			full: __( 'Notes expanded.' ),
			minimized: __( 'Notes minimized.' ),
			hidden: __( 'Notes hidden.' ),
		};
		speak( messages[ mode ] );
	}

	function toggleAllNotes() {
		if ( isAllNotesOpen ) {
			disableComplementaryArea( 'core' );
		} else {
			enableComplementaryArea( 'core', ALL_NOTES_SIDEBAR );
		}
	}

	return (
		<NotesMoreMenuGroup.Fill>
			<MoreMenuSubmenu label={ __( 'Notes' ) }>
				{ isLargeViewport && (
					<DisplayModeItems
						displayMode={ displayMode }
						onChange={ setDisplayMode }
					/>
				) }
				{ isLargeViewport && hasAllNotes && <Menu.Separator /> }
				{ hasAllNotes && (
					<Menu.CheckboxItem
						checked={ isAllNotesOpen }
						onCheckedChange={ toggleAllNotes }
					>
						<Menu.ItemLabel>
							{ __( 'Show all notes' ) }
						</Menu.ItemLabel>
					</Menu.CheckboxItem>
				) }
			</MoreMenuSubmenu>
		</NotesMoreMenuGroup.Fill>
	);
}
