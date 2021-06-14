/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import {
	__experimentalUseDialog as useDialog,
	useViewportMatch,
} from '@wordpress/compose';
import { close } from '@wordpress/icons';
import {
	__experimentalLibrary as Library,
	BlockBreadcrumb,
} from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	InterfaceSkeleton,
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Header from '../header';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';
import useWidgetLibraryInsertionPoint from '../../hooks/use-widget-library-insertion-point';
import { store as editWidgetsStore } from '../../store';

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
	const { setIsInserterOpened, closeGeneralSidebar } = useDispatch(
		editWidgetsStore
	);
	const { rootClientId, insertionIndex } = useWidgetLibraryInsertionPoint();

	const {
		hasBlockBreadCrumbsEnabled,
		hasSidebarEnabled,
		isInserterOpened,
	} = useSelect(
		( select ) => ( {
			hasSidebarEnabled: !! select(
				interfaceStore
			).getActiveComplementaryArea( editWidgetsStore.name ),
			isInserterOpened: !! select( editWidgetsStore ).isInserterOpened(),
			hasBlockBreadCrumbsEnabled: select(
				editWidgetsStore
			).__unstableIsFeatureActive( 'showBlockBreadcrumbs' ),
		} ),
		[]
	);

	// Inserter and Sidebars are mutually exclusive
	useEffect( () => {
		if ( hasSidebarEnabled && ! isHugeViewport ) {
			setIsInserterOpened( false );
		}
	}, [ hasSidebarEnabled, isHugeViewport ] );

	useEffect( () => {
		if ( isInserterOpened && ! isHugeViewport ) {
			closeGeneralSidebar();
		}
	}, [ isInserterOpened, isHugeViewport ] );

	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: () => setIsInserterOpened( false ),
	} );

	return (
		<InterfaceSkeleton
			labels={ interfaceLabels }
			header={ <Header /> }
			secondarySidebar={
				isInserterOpened && (
					<div
						ref={ inserterDialogRef }
						{ ...inserterDialogProps }
						className="edit-widgets-layout__inserter-panel"
					>
						<div className="edit-widgets-layout__inserter-panel-header">
							<Button
								icon={ close }
								onClick={ () => setIsInserterOpened( false ) }
							/>
						</div>
						<div className="edit-widgets-layout__inserter-panel-content">
							<Library
								showInserterHelpPanel
								shouldFocusBlock={ isMobileViewport }
								rootClientId={ rootClientId }
								__experimentalInsertionIndex={ insertionIndex }
							/>
						</div>
					</div>
				)
			}
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
		/>
	);
}

export default Interface;
