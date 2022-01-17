/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { BlockBreadcrumb } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	InterfaceSkeleton,
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import Header from '../header';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';
import { store as editWidgetsStore } from '../../store';
import SecondarySidebar from '../secondary-sidebar';

const interfaceLabels = {
	/* translators: accessibility text for the widgets screen top bar landmark region. */
	header: __( 'Widgets top bar' ),
	/* translators: accessibility text for the widgets screen content landmark region. */
	body: __( 'Widgets and blocks' ),
	/* translators: accessibility text for the widgets screen settings landmark region. */
	sidebar: __( 'Widgets settings' ),
	/* translators: accessibility text for the widgets screen footer landmark region. */
	footer: __( 'Widgets footer' ),
};

function Interface( { blockEditorSettings } ) {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isHugeViewport = useViewportMatch( 'huge', '>=' );
	const {
		setIsInserterOpened,
		setIsListViewOpened,
		closeGeneralSidebar,
	} = useDispatch( editWidgetsStore );
	const {
		hasBlockBreadCrumbsEnabled,
		hasSidebarEnabled,
		isInserterOpened,
		isListViewOpened,
		previousShortcut,
		nextShortcut,
	} = useSelect(
		( select ) => ( {
			hasSidebarEnabled: !! select(
				interfaceStore
			).getActiveComplementaryArea( editWidgetsStore.name ),
			isInserterOpened: !! select( editWidgetsStore ).isInserterOpened(),
			isListViewOpened: !! select( editWidgetsStore ).isListViewOpened(),
			hasBlockBreadCrumbsEnabled: select(
				interfaceStore
			).isFeatureActive( 'core/edit-widgets', 'showBlockBreadcrumbs' ),
			previousShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations(
				'core/edit-widgets/previous-region'
			),
			nextShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/edit-widgets/next-region' ),
		} ),
		[]
	);

	// Inserter and Sidebars are mutually exclusive
	useEffect( () => {
		if ( hasSidebarEnabled && ! isHugeViewport ) {
			setIsInserterOpened( false );
			setIsListViewOpened( false );
		}
	}, [ hasSidebarEnabled, isHugeViewport ] );

	useEffect( () => {
		if ( ( isInserterOpened || isListViewOpened ) && ! isHugeViewport ) {
			closeGeneralSidebar();
		}
	}, [ isInserterOpened, isListViewOpened, isHugeViewport ] );

	const hasSecondarySidebar = isListViewOpened || isInserterOpened;

	return (
		<InterfaceSkeleton
			labels={ interfaceLabels }
			header={ <Header /> }
			secondarySidebar={ hasSecondarySidebar && <SecondarySidebar /> }
			sidebar={
				hasSidebarEnabled && (
					<ComplementaryArea.Slot scope="core/edit-widgets" />
				)
			}
			content={
				<WidgetAreasBlockEditorContent
					blockEditorSettings={ blockEditorSettings }
				/>
			}
			footer={
				hasBlockBreadCrumbsEnabled &&
				! isMobileViewport && (
					<div className="edit-widgets-layout__footer">
						<BlockBreadcrumb rootLabelText={ __( 'Widgets' ) } />
					</div>
				)
			}
			shortcuts={ {
				previous: previousShortcut,
				next: nextShortcut,
			} }
		/>
	);
}

export default Interface;
