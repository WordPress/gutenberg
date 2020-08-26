/**
 * WordPress dependencies
 */
import { Button, Popover } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';
import { close } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { buildWidgetAreasPostId, KIND, POST_TYPE } from '../../store/utils';

/**
 * Internal dependencies
 */
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';

function Layout( { blockEditorSettings } ) {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const hasSidebarEnabled = useSelect(
		( select ) =>
			!! select( 'core/interface' ).getActiveComplementaryArea(
				'core/edit-widgets'
			)
	);

	const rootClientId = useSelect( ( select ) => {
		const { getBlockRootClientId, getBlockSelectionEnd } = select(
			'core/block-editor'
		);
		const selectedRootId = getBlockRootClientId( getBlockSelectionEnd() );
		if ( selectedRootId ) {
			return selectedRootId;
		}

		// Default to the first widget area
		const { getEntityRecord } = select( 'core' );
		const widgetAreasPost = getEntityRecord(
			KIND,
			POST_TYPE,
			buildWidgetAreasPostId()
		);
		if ( widgetAreasPost ) {
			return widgetAreasPost?.blocks[ 0 ]?.clientId;
		}
	}, [] );

	const [ isInserterOpened, setIsInserterOpened ] = useState( true );
	return (
		<WidgetAreasBlockEditorProvider
			blockEditorSettings={ blockEditorSettings }
		>
			<InterfaceSkeleton
				header={
					<Header
						isInserterOpen={ isInserterOpened }
						onInserterToggle={ () =>
							setIsInserterOpened( ! isInserterOpened )
						}
						rootClientId={ rootClientId }
					/>
				}
				leftSidebar={
					isInserterOpened && (
						<div
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
										rootClientId={ rootClientId }
										showMostUsedBlocks={ false }
										showInserterHelpPanel
										onSelect={ () => {
											if ( isMobileViewport ) {
												setIsInserterOpened( false );
											}
										} }
									/>
								</div>
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
			/>
			<Sidebar />
			<Popover.Slot />
		</WidgetAreasBlockEditorProvider>
	);
}

export default Layout;
