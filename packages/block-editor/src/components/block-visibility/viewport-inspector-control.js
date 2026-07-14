/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';
import { BLOCK_VISIBILITY_VIEWPORTS } from './constants';
import { isBlockHiddenForViewport } from './utils';

const VIEWPORT_BY_STYLE_STATE = {
	'@tablet': BLOCK_VISIBILITY_VIEWPORTS.tablet.key,
	'@mobile': BLOCK_VISIBILITY_VIEWPORTS.mobile.key,
};

export default function ViewportVisibilityInspectorControl( {
	blockEditingMode,
	blockName,
	clientId,
	selectedBlockStyleState,
} ) {
	const viewport =
		VIEWPORT_BY_STYLE_STATE[ selectedBlockStyleState?.viewport ];
	const viewportLabel = BLOCK_VISIBILITY_VIEWPORTS[ viewport ]?.label;
	const attributes = useSelect(
		( select ) => select( blockEditorStore ).getBlockAttributes( clientId ),
		[ clientId ]
	);
	const blockVisibility = attributes?.metadata?.blockVisibility;
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	if (
		! clientId ||
		! viewport ||
		! viewportLabel ||
		blockEditingMode !== 'default' ||
		blockVisibility === false ||
		! hasBlockSupport( blockName, 'visibility', true )
	) {
		return null;
	}

	const isHidden = isBlockHiddenForViewport( { attributes }, viewport );
	const setViewportHidden = ( isHiddenOnViewport ) => {
		const nextBlockVisibility = cleanEmptyObject( {
			viewport: {
				...blockVisibility?.viewport,
				[ viewport ]: isHiddenOnViewport ? false : undefined,
			},
		} );

		updateBlockAttributes( clientId, {
			metadata: cleanEmptyObject( {
				...attributes?.metadata,
				blockVisibility: nextBlockVisibility,
			} ),
		} );
	};
	const label = sprintf(
		/* translators: %s: viewport name, e.g. Tablet or Mobile. */
		__( 'Hide on %s' ),
		viewportLabel
	);

	return (
		<ToolsPanel
			label={ __( 'Visibility' ) }
			resetAll={ () => setViewportHidden( false ) }
			panelId={ clientId }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				label={ label }
				hasValue={ () => isHidden }
				onDeselect={ () => setViewportHidden( false ) }
				isShownByDefault
				panelId={ clientId }
			>
				<ToggleControl
					label={ label }
					checked={ isHidden }
					onChange={ setViewportHidden }
				/>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}
