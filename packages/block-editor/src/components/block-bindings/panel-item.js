/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockBindingsSource } from '@wordpress/blocks';
import {
	__experimentalItem as Item,
	__experimentalText as Text,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useBlockBindingsUtils } from '../../utils/block-bindings';
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

export default function BlockBindingsPanelItem( {
	attribute,
	binding,
	children,
	data,
} ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );

	const { source: sourceName, args } = binding || {};
	const source = getBlockBindingsSource( sourceName );

	let displayText;
	let isValid = true;

	if ( binding === undefined ) {
		if ( ! children ) {
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
			data?.find( ( item ) => fastDeepEqual( item.args, args ) )?.label ||
			source?.label ||
			sourceName;
	}

	return (
		<ToolsPanelItem
			hasValue={ () => !! binding }
			label={ attribute }
			onDeselect={
				!! children &&
				( () => {
					updateBlockBindings( {
						[ attribute ]: undefined,
					} );
				} )
			}
		>
			<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
				<Menu.TriggerButton render={ <Item /> } disabled={ ! children }>
					<VStack
						className="block-editor-bindings__item"
						spacing={ 0 }
					>
						<Text truncate>{ attribute }</Text>
						<Text
							truncate
							variant={ isValid ? 'muted' : undefined }
							isDestructive={ ! isValid }
						>
							{ displayText }
						</Text>
					</VStack>
				</Menu.TriggerButton>
				{ !! children && (
					<Menu.Popover gutter={ isMobile ? 8 : 36 }>
						{ children }
					</Menu.Popover>
				) }
			</Menu>
		</ToolsPanelItem>
	);
}
