/**
 * WordPress dependencies
 */
import { Popover, Button } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { close } from '@wordpress/icons';
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';
import { PluginArea } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';
import PopoverWrapper from './popover-wrapper';
import useLastSelectedRootId from '../../hooks/use-last-selected-root-id';

function Layout( { blockEditorSettings } ) {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isHugeViewport = useViewportMatch( 'huge', '>=' );
	const { setIsInserterOpened, closeGeneralSidebar } = useDispatch(
		'core/edit-widgets'
	);
	const rootClientId = useLastSelectedRootId();

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
		<WidgetAreasBlockEditorProvider
			blockEditorSettings={ blockEditorSettings }
		>
			<InterfaceSkeleton
				header={ <Header /> }
				leftSidebar={
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
			<Sidebar />
			<Popover.Slot />
			<PluginArea />
		</WidgetAreasBlockEditorProvider>
	);
}

export default Layout;
