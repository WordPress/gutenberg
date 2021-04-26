/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, Platform } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import {
	BlockInspector,
	store as blockEditorStore,
} from '@wordpress/block-editor';

import { cog } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );

const BLOCK_INSPECTOR_IDENTIFIER = 'edit-widgets/block-inspector';

// Widget areas were one called block areas, so use 'edit-widgets/block-areas'
// for backwards compatibility.
const WIDGET_AREAS_IDENTIFIER = 'edit-widgets/block-areas';

/**
 * Internal dependencies
 */
import WidgetAreas from './widget-areas';
import { store as editWidgetsStore } from '../../store';

function ComplementaryAreaTab( { identifier, label, isActive } ) {
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	return (
		<Button
			onClick={ () =>
				enableComplementaryArea( editWidgetsStore.name, identifier )
			}
			className={ classnames( 'edit-widgets-sidebar__panel-tab', {
				'is-active': isActive,
			} ) }
			aria-label={
				isActive
					? // translators: %s: sidebar label e.g: "Widget Areas".
					  sprintf( __( '%s (selected)' ), label )
					: label
			}
			data-label={ label }
		>
			{ label }
		</Button>
	);
}

export default function Sidebar() {
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const {
		currentArea,
		hasSelectedNonAreaBlock,
		isGeneralSidebarOpen,
		selectedWidgetAreaBlock,
	} = useSelect( ( select ) => {
		const {
			getSelectedBlock,
			getBlock,
			getBlockParentsByBlockName,
		} = select( blockEditorStore );
		const { getActiveComplementaryArea } = select( interfaceStore );

		const selectedBlock = getSelectedBlock();

		let activeArea = getActiveComplementaryArea( editWidgetsStore.name );
		if ( ! activeArea ) {
			if ( selectedBlock ) {
				activeArea = BLOCK_INSPECTOR_IDENTIFIER;
			} else {
				activeArea = WIDGET_AREAS_IDENTIFIER;
			}
		}

		const isSidebarOpen = !! activeArea;

		let widgetAreaBlock;
		if ( selectedBlock ) {
			if ( selectedBlock.name === 'core/widget-area' ) {
				widgetAreaBlock = selectedBlock;
			} else {
				widgetAreaBlock = getBlock(
					getBlockParentsByBlockName(
						selectedBlock.clientId,
						'core/widget-area'
					)[ 0 ]
				);
			}
		}

		return {
			currentArea: activeArea,
			hasSelectedNonAreaBlock: !! (
				selectedBlock && selectedBlock.name !== 'core/widget-area'
			),
			isGeneralSidebarOpen: isSidebarOpen,
			selectedWidgetAreaBlock: widgetAreaBlock,
		};
	}, [] );

	// currentArea, and isGeneralSidebarOpen are intentionally left out from the dependencies,
	// because we want to run the effect when a block is selected/unselected and not when the sidebar state changes.
	useEffect( () => {
		if (
			hasSelectedNonAreaBlock &&
			currentArea === WIDGET_AREAS_IDENTIFIER &&
			isGeneralSidebarOpen
		) {
			enableComplementaryArea(
				editWidgetsStore,
				BLOCK_INSPECTOR_IDENTIFIER
			);
		}
		if (
			! hasSelectedNonAreaBlock &&
			currentArea === BLOCK_INSPECTOR_IDENTIFIER &&
			isGeneralSidebarOpen
		) {
			enableComplementaryArea(
				editWidgetsStore,
				WIDGET_AREAS_IDENTIFIER
			);
		}
	}, [ hasSelectedNonAreaBlock, enableComplementaryArea ] );

	return (
		<ComplementaryArea
			className="edit-widgets-sidebar"
			header={
				<ul>
					<li>
						<ComplementaryAreaTab
							identifier={ WIDGET_AREAS_IDENTIFIER }
							label={
								selectedWidgetAreaBlock
									? selectedWidgetAreaBlock.attributes.name
									: __( 'Widget Areas' )
							}
							isActive={ currentArea === WIDGET_AREAS_IDENTIFIER }
						/>
					</li>
					<li>
						<ComplementaryAreaTab
							identifier={ BLOCK_INSPECTOR_IDENTIFIER }
							label={ __( 'Block' ) }
							isActive={
								currentArea === BLOCK_INSPECTOR_IDENTIFIER
							}
						/>
					</li>
				</ul>
			}
			headerClassName="edit-widgets-sidebar__panel-tabs"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			closeLabel={ __( 'Close settings' ) }
			scope="core/edit-widgets"
			identifier={ currentArea }
			icon={ cog }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
		>
			{ currentArea === WIDGET_AREAS_IDENTIFIER && (
				<WidgetAreas
					selectedWidgetAreaId={
						selectedWidgetAreaBlock?.attributes.id
					}
				/>
			) }
			{ currentArea === BLOCK_INSPECTOR_IDENTIFIER &&
				( hasSelectedNonAreaBlock ? (
					<BlockInspector />
				) : (
					// Pretend that Widget Areas are part of the UI by not
					// showing the Block Inspector when one is selected.
					<span className="block-editor-block-inspector__no-blocks">
						{ __( 'No block selected.' ) }
					</span>
				) ) }
		</ComplementaryArea>
	);
}
