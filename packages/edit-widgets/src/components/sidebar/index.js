/**
 * External dependencies
 */
import { map } from 'lodash';
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
import BlockAreas from './block-areas';

const CORE_WIDGET_COMPLEMENTARY_AREAS = {
	'edit-widgets/block-areas': __( 'Block areas' ),
	'edit-widgets/block-inspector': __( 'Block' ),
};

function ComplementaryAreaHeader( { activeComplementaryArea } ) {
	const { enableComplementaryArea } = useDispatch( 'core/interface' );
	return (
		<ul>
			{ map( CORE_WIDGET_COMPLEMENTARY_AREAS, ( label, identifier ) => {
				const isActive = identifier === activeComplementaryArea;
				return (
					<li key={ identifier }>
						<Button
							onClick={ () =>
								enableComplementaryArea(
									'core/edit-widgets',
									identifier
								)
							}
							className={ classnames(
								'edit-widgets-sidebar__panel-tab',
								{
									'is-active': isActive,
								}
							) }
							aria-label={
								isActive
									? // translators: %s: sidebar label e.g: "Block areas".
									  sprintf( __( '%s (selected)' ), label )
									: label
							}
							data-label={ label }
						>
							{ label }
						</Button>
					</li>
				);
			} ) }
		</ul>
	);
}

export default function Sidebar() {
	const { enableComplementaryArea } = useDispatch( 'core/interface' );
	const {
		currentArea,
		hasSelectedNonAreaBlock,
		isGeneralSidebarOpen,
	} = useSelect( ( select ) => {
		let activeArea = select( 'core/interface' ).getActiveComplementaryArea(
			'core/edit-widgets'
		);
		const isSidebarOpen = !! activeArea;
		const { getBlockSelectionStart, getBlockRootClientId } = select(
			'core/block-editor'
		);
		const selectionStart = getBlockSelectionStart();
		if ( ! CORE_WIDGET_COMPLEMENTARY_AREAS[ activeArea ] ) {
			if ( ! selectionStart ) {
				activeArea = 'edit-widgets/block-areas';
			} else {
				activeArea = 'edit-widgets/block-inspector';
			}
		}
		return {
			currentArea: activeArea,
			hasSelectedNonAreaBlock: !! (
				selectionStart && getBlockRootClientId( selectionStart )
			),
			isGeneralSidebarOpen: isSidebarOpen,
		};
	}, [] );

	// currentArea, and isGeneralSidebarOpen are intentionally left out from the dependencies,
	// because we want to run the effect when a block is selected/unselected and not when the sidebar state changes.
	useEffect( () => {
		if (
			hasSelectedNonAreaBlock &&
			currentArea === 'edit-widgets/block-areas' &&
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
				'edit-widgets/block-areas'
			);
		}
	}, [ hasSelectedNonAreaBlock, enableComplementaryArea ] );

	return (
		<ComplementaryArea
			className="edit-widgets-sidebar"
			header={
				<ComplementaryAreaHeader
					activeComplementaryArea={ currentArea }
				/>
			}
			headerClassName="edit-widgets-sidebar__panel-tabs"
			scope="core/edit-widgets"
			identifier={ currentArea }
			icon={ cog }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
		>
			{ currentArea === 'edit-widgets/block-areas' && <BlockAreas /> }
			{ currentArea === 'edit-widgets/block-inspector' && (
				<BlockInspector />
			) }
		</ComplementaryArea>
	);
}
