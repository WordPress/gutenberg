/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { MenuGroup } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { displayShortcut } from '@wordpress/keycodes';
import { PreferenceToggleMenuItem } from '@wordpress/preferences';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as postEditorStore } from '../../../store';

function WritingMenu( { onClose } ) {
	const isDistractionFree = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().isDistractionFree,
		[]
	);

	const blocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks(),
		[]
	);

	const {
		setIsInserterOpened,
		setIsListViewOpened,
		closeGeneralSidebar,
		setFeature,
	} = useDispatch( postEditorStore );

	const { selectBlock } = useDispatch( blockEditorStore );

	const toggleDistractionFree = () => {
		setFeature( 'inlineToolbar', ! isDistractionFree );
		setFeature( 'fixedToolbar', false );
		setIsInserterOpened( false );
		setIsListViewOpened( false );
		closeGeneralSidebar();
		onClose();
		if ( ! isDistractionFree ) {
			selectBlock( blocks[ 0 ].clientId );
		}
	};

	const isLargeViewport = useViewportMatch( 'medium' );
	if ( ! isLargeViewport ) {
		return null;
	}

	return (
		<MenuGroup label={ _x( 'View', 'noun' ) }>
			<PreferenceToggleMenuItem
				scope="core/edit-post"
				disabled={ isDistractionFree }
				name="fixedToolbar"
				label={ __( 'Top toolbar' ) }
				info={ __(
					'Access all block and document tools in a single place'
				) }
				messageActivated={ __( 'Top toolbar activated' ) }
				messageDeactivated={ __( 'Top toolbar deactivated' ) }
			/>
			<PreferenceToggleMenuItem
				scope="core/edit-post"
				name="focusMode"
				label={ __( 'Spotlight mode' ) }
				info={ __( 'Focus on one block at a time' ) }
				messageActivated={ __( 'Spotlight mode activated' ) }
				messageDeactivated={ __( 'Spotlight mode deactivated' ) }
			/>
			<PreferenceToggleMenuItem
				scope="core/edit-post"
				name="fullscreenMode"
				label={ __( 'Fullscreen mode' ) }
				info={ __( 'Show and hide admin UI' ) }
				messageActivated={ __( 'Fullscreen mode activated' ) }
				messageDeactivated={ __( 'Fullscreen mode deactivated' ) }
				shortcut={ displayShortcut.secondary( 'f' ) }
			/>
			<PreferenceToggleMenuItem
				scope="core/edit-post"
				name="distractionFree"
				toggleHandler={ toggleDistractionFree }
				label={ __( 'Toggle interface' ) }
				info={ __( 'Work without distraction' ) }
				messageActivated={ __( 'Distraction free mode activated' ) }
				messageDeactivated={ __( 'Distraction free mode deactivated' ) }
				shortcut={ displayShortcut.primaryShift( '\\' ) }
			/>
		</MenuGroup>
	);
}

export default WritingMenu;
