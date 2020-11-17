/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { close } from '@wordpress/icons';
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Header from '../header';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';
import PopoverWrapper from './popover-wrapper';
import useWidgetLibraryInsertionPoint from '../../hooks/use-widget-library-insertion-point';

const interfaceLabels = {
	/* translators: accessibility text for the widgets screen top bar landmark region. */
	header: __( 'Widgets top bar' ),
	/* translators: accessibility text for the widgets screen content landmark region. */
	body: __( 'Widgets and blocks' ),
	/* translators: accessibility text for the widgets screen settings landmark region. */
	sidebar: __( 'Widgets settings' ),
};

function Interface( { blockEditorSettings } ) {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isHugeViewport = useViewportMatch( 'huge', '>=' );
	const { setIsInserterOpened, closeGeneralSidebar } = useDispatch(
		'core/edit-widgets'
	);
	const { rootClientId, insertionIndex } = useWidgetLibraryInsertionPoint();

	const { hasSidebarEnabled, isInserterOpened } = useSelect( ( select ) => ( {
		hasSidebarEnabled: !! select(
			'core/interface'
		).getActiveComplementaryArea( 'core/edit-widgets' ),
		isInserterOpened: !! select( 'core/edit-widgets' ).isInserterOpened(),
	} ) );

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

	return (
		<InterfaceSkeleton
			labels={ interfaceLabels }
			header={ <Header /> }
			secondarySidebar={
				isInserterOpened && (
					<PopoverWrapper
						className="edit-widgets-layout__inserter-panel-popover-wrapper"
						onClose={ () => setIsInserterOpened( false ) }
					>
						<div className="edit-widgets-layout__inserter-panel">
							<div className="edit-widgets-layout__inserter-panel-header">
								<Button
									icon={ close }
									onClick={ () =>
										setIsInserterOpened( false )
									}
								/>
							</div>
							<div className="edit-widgets-layout__inserter-panel-content">
								<Library
									showInserterHelpPanel
									onSelect={ () => {
										if ( isMobileViewport ) {
											setIsInserterOpened( false );
										}
									} }
									rootClientId={ rootClientId }
									__experimentalInsertionIndex={
										insertionIndex
									}
								/>
							</div>
						</div>
					</PopoverWrapper>
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
		/>
	);
}

export default Interface;
