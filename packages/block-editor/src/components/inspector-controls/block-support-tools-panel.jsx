import clsx from 'clsx';
import {
	Button,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	createPortal,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { info as infoIcon } from '@wordpress/icons';
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';
import { isGlobalStylesInheritanceIndicatorUIEnabled } from '../global-styles/inheritance';

/**
 * Makes a spot in the panel header, just before the options menu, for the
 * style origins toggle. The header belongs to `ToolsPanel`, so the spot is
 * added to its DOM: a real element before the menu, not a visual reorder, so
 * the reading and tab order match what is shown.
 *
 * @param {Object} ref     Ref to the panel element.
 * @param {string} panelId Selected block, which the panel is keyed by.
 * @return {?Element} Where to render the toggle.
 */
function useStyleOriginsContainer( ref, panelId ) {
	const [ container, setContainer ] = useState( null );
	useEffect( () => {
		const panel = ref.current;
		if ( ! panel || ! isGlobalStylesInheritanceIndicatorUIEnabled() ) {
			return;
		}
		const { ownerDocument } = panel;
		const spot = ownerDocument.createElement( 'div' );
		spot.className = 'global-styles-origins-toggle-container';
		const place = () => {
			const header = panel.querySelector(
				':scope > .components-tools-panel-header'
			);
			if ( header && spot.parentNode !== header ) {
				header.insertBefore(
					spot,
					header.querySelector( ':scope > .components-dropdown-menu' )
				);
				setContainer( spot );
			}
		};
		place();
		const observer = new ownerDocument.defaultView.MutationObserver(
			place
		);
		observer.observe( panel, { childList: true } );
		return () => {
			observer.disconnect();
			spot.remove();
		};
		// The panel remounts for each selected block (it is keyed by
		// `panelId`), so attach to the new panel element.
	}, [ ref, panelId ] );
	return container;
}

export default function BlockSupportToolsPanel( { children, group, label } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const {
		getBlockAttributes,
		getBlockName,
		getMultiSelectedBlockClientIds,
		getSelectedBlockClientId,
		hasMultiSelection,
	} = useSelect( blockEditorStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const panelId = getSelectedBlockClientId();
	const ref = useRef();
	const container = useStyleOriginsContainer( ref, panelId );
	// Shows where every value in the panel comes from. The state lives here,
	// outside the `ToolsPanel` keyed by the selected block, so once turned on
	// it stays on while moving between blocks, to compare them.
	const [ isShowingOrigins, setIsShowingOrigins ] = useState( false );
	const resetAll = useCallback(
		( resetFilters = [] ) => {
			const newAttributes = {};

			const clientIds = hasMultiSelection()
				? getMultiSelectedBlockClientIds()
				: [ panelId ];

			clientIds.forEach( ( clientId ) => {
				const blockAttributes = getBlockAttributes( clientId ) || {};
				const { style } = blockAttributes;
				let newBlockAttributes = { style };
				const resetContext = {
					attributes: blockAttributes,
					clientId,
					name: getBlockName( clientId ),
				};

				resetFilters.forEach( ( resetFilter ) => {
					newBlockAttributes = {
						...newBlockAttributes,
						...resetFilter( newBlockAttributes, resetContext ),
					};
				} );

				// Enforce a cleaned style object.
				newBlockAttributes = {
					...newBlockAttributes,
					style: cleanEmptyObject( newBlockAttributes.style ),
				};

				newAttributes[ clientId ] = newBlockAttributes;
			} );

			updateBlockAttributes( clientIds, newAttributes, true );
		},
		[
			getBlockAttributes,
			getBlockName,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
			panelId,
			updateBlockAttributes,
		]
	);

	return (
		<ToolsPanel
			ref={ ref }
			className={ clsx( `${ group }-block-support-panel`, {
				'is-showing-style-origins': isShowingOrigins,
			} ) }
			label={ label }
			resetAll={ resetAll }
			key={ panelId }
			panelId={ panelId }
			hasInnerWrapper
			shouldRenderPlaceholderItems // Required to maintain fills ordering.
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
			{ container &&
				createPortal(
					<Button
						className="global-styles-origins-toggle"
						size="small"
						icon={ infoIcon }
						// One label: a toggle button's state comes from
						// `aria-pressed`, so its name stays the same.
						label={ __( 'Where styles come from' ) }
						isPressed={ isShowingOrigins }
						onClick={ () =>
							setIsShowingOrigins( ( isShowing ) => ! isShowing )
						}
					/>,
					container
				) }
		</ToolsPanel>
	);
}
