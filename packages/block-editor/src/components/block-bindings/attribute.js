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
import { getAttributeType } from './panel-menu-content';

const { Menu } = unlock( componentsPrivateApis );

function BlockBindingsAttribute( { attribute, binding, sources, blockName } ) {
	const { source: sourceName, args } = binding || {};
	const data = sources?.[ sourceName ];
	const source = getBlockBindingsSource( sourceName );

	let displayText;
	let isValid = true;
	const isNotBound = binding === undefined;

	if ( isNotBound ) {
		// Check if there are any compatible sources for this attribute type.
		const attributeType = getAttributeType( blockName, attribute );

		const hasCompatibleSources = Object.values( sources ).some( ( items ) =>
			items.some( ( item ) => item.type === attributeType )
		);

		if ( ! hasCompatibleSources ) {
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
		<VStack className="block-editor-bindings__item" spacing={ 0 }>
			<Text truncate>{ attribute }</Text>
			<Text
				truncate
				variant={ isValid ? 'muted' : undefined }
				isDestructive={ ! isValid }
			>
				{ displayText }
			</Text>
		</VStack>
	);
}

export default function BlockBindingsPanelItem( {
	attribute,
	binding,
	children,
	sources,
	blockName,
} ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );

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
					<BlockBindingsAttribute
						attribute={ attribute }
						binding={ binding }
						sources={ sources }
						blockName={ blockName }
					/>
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
