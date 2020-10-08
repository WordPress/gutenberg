/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, Platform } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { ComplementaryArea } from '@wordpress/interface';
import { BlockInspector } from '@wordpress/block-editor';
import { cog } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );

/**
 * Internal dependencies
 */
import WidgetAreas from './widget-areas';

function ComplementaryAreaTab( { identifier, label, isActive } ) {
	const { enableComplementaryArea } = useDispatch( 'core/interface' );
	return (
		<Button
			onClick={ () =>
				enableComplementaryArea( 'core/edit-widgets', identifier )
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
	const { enableComplementaryArea } = useDispatch( 'core/interface' );
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
		} = select( 'core/block-editor' );
		const { getActiveComplementaryArea } = select( 'core/interface' );

		const selectedBlock = getSelectedBlock();

		let activeArea = getActiveComplementaryArea( 'core/edit-widgets' );
		if ( ! activeArea ) {
			if ( selectedBlock ) {
				activeArea = 'edit-widgets/block-inspector';
			} else {
				activeArea = 'edit-widgets/widget-areas';
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
			currentArea === 'edit-widgets/widget-areas' &&
			isGeneralSidebarOpen
		) {
			enableComplementaryArea(
				'core/edit-widgets',
				'edit-widgets/block-inspector'
			);
		}
		if (
			! hasSelectedNonAreaBlock &&
			currentArea === 'edit-widgets/block-inspector' &&
			isGeneralSidebarOpen
		) {
			enableComplementaryArea(
				'core/edit-widgets',
				'edit-widgets/widget-areas'
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
							identifier="edit-widgets/widget-areas"
							label={
								selectedWidgetAreaBlock
									? selectedWidgetAreaBlock.attributes.name
									: __( 'Widget Areas' )
							}
							isActive={
								currentArea === 'edit-widgets/widget-areas'
							}
						/>
					</li>
					<li>
						<ComplementaryAreaTab
							identifier="edit-widgets/block-inspector"
							label={ __( 'Block' ) }
							isActive={
								currentArea === 'edit-widgets/block-inspector'
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
			{ currentArea === 'edit-widgets/widget-areas' && (
				<WidgetAreas
					selectedWidgetAreaId={
						selectedWidgetAreaBlock?.attributes.id
					}
				/>
			) }
			{ currentArea === 'edit-widgets/block-inspector' &&
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
