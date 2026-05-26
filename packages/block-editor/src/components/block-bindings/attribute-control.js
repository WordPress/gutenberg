/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockBindingsSource } from '@wordpress/blocks';
import {
	__experimentalItem as Item,
	__experimentalText as WCText,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockContext from '../block-context';
import BlockBindingsSourceFieldsList from './source-fields-list';
import useBlockBindingsUtils from './use-block-bindings-utils';
import useBlockBindingsCompatibleFields from './use-block-bindings-compatible-fields';
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';

const { Menu } = unlock( componentsPrivateApis );

export default function BlockBindingsAttributeControl( {
	attribute,
	binding,
	blockName,
} ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );

	const blockContext = useContext( BlockContext );
	// Reuse the shared hook (spec req 10). The legacy panel only needs the
	// `compatibleFields` map here; the broader `isBindable` gate is enforced
	// elsewhere (`bindableAttributes` in `block-bindings.js`). The duplicate
	// `canUpdateBlockBindings` read below is intentional accepted tech debt —
	// collapsing into the hook would entangle the hook's return shape with
	// legacy-panel-specific gate granularity (the panel renders the item but
	// disables the menu rather than hiding it).
	const { compatibleFields } = useBlockBindingsCompatibleFields(
		attribute,
		blockName,
		blockContext
	);

	const { canUpdateBlockBindings } = useSelect( ( select ) => ( {
		canUpdateBlockBindings:
			select( blockEditorStore ).getSettings().canUpdateBlockBindings,
	} ) );

	const hasCompatibleFields = Object.keys( compatibleFields ).length > 0;

	// Lock the UI when the user can't update bindings or there are no fields to connect to.
	const isAttributeReadOnly =
		! canUpdateBlockBindings || ! hasCompatibleFields;

	const { source: boundSourceName, args } = binding || {};
	const source = getBlockBindingsSource( boundSourceName );

	let displayText;
	let isValid = true;

	if ( binding === undefined ) {
		if ( ! hasCompatibleFields ) {
			displayText = __( 'No sources available' );
		} else {
			displayText = __( 'Not connected' );
		}
		isValid = true;
	} else if ( ! source ) {
		// If there's a binding but the source is not found, it's invalid.
		isValid = false;
		displayText = __( 'Source not registered' );
	} else {
		displayText =
			compatibleFields?.[ boundSourceName ]?.find( ( field ) =>
				fastDeepEqual( field.args, args )
			)?.label ||
			source?.label ||
			boundSourceName;
	}

	return (
		<ToolsPanelItem
			hasValue={ () => !! binding }
			label={ attribute }
			onDeselect={
				!! hasCompatibleFields &&
				( () => {
					updateBlockBindings( {
						[ attribute ]: undefined,
					} );
				} )
			}
		>
			<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
				<Menu.TriggerButton
					render={ <Item /> }
					disabled={ ! hasCompatibleFields }
				>
					<VStack
						className="block-editor-bindings__item"
						spacing={ 0 }
					>
						<WCText truncate>{ attribute }</WCText>
						<WCText
							truncate
							variant={ isValid ? 'muted' : undefined }
							isDestructive={ ! isValid }
						>
							{ displayText }
						</WCText>
					</VStack>
				</Menu.TriggerButton>
				{ ! isAttributeReadOnly && (
					<Menu.Popover gutter={ isMobile ? 8 : 36 }>
						<Menu
							placement={
								isMobile ? 'bottom-start' : 'left-start'
							}
						>
							{ Object.entries( compatibleFields ).map(
								( [ sourceKey, fields ] ) => (
									<BlockBindingsSourceFieldsList
										key={ sourceKey }
										args={ binding?.args }
										attribute={ attribute }
										sourceKey={ sourceKey }
										fields={ fields }
									/>
								)
							) }
						</Menu>
					</Menu.Popover>
				) }
			</Menu>
		</ToolsPanelItem>
	);
}
