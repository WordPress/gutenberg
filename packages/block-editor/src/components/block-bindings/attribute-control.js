/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getBlockType,
	getBlockBindingsSource,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	__experimentalItem as Item,
	__experimentalText as Text,
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
import { useBlockBindingsUtils } from '../../utils/block-bindings';
import { unlock } from '../../lock-unlock';
import BlockContext from '../block-context';

const { Menu } = unlock( componentsPrivateApis );

/**
 * Get the normalized attribute type for block bindings.
 * Converts 'rich-text' to 'string' since rich-text is stored as string.
 *
 * @param {string} blockName The block name.
 * @param {string} attribute The attribute name.
 * @return {string} The normalized attribute type.
 */
const getAttributeType = ( blockName, attribute ) => {
	const _attributeType =
		getBlockType( blockName ).attributes?.[ attribute ]?.type;
	return _attributeType === 'rich-text' ? 'string' : _attributeType;
};

export default function BlockBindingsAttributeControl( {
	attribute,
	binding,
	blockName,
	children,
} ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );

	const blockContext = useContext( BlockContext );
	const sources = useSelect(
		( select ) => {
			const {
				getAllBlockBindingsSources,
				getBlockBindingsSourceFieldsList,
			} = unlock( select( blocksStore ) );
			const sourceFields = {};
			Object.entries( getAllBlockBindingsSources() ).forEach(
				( [ sourceName, source ] ) => {
					const fieldsList = getBlockBindingsSourceFieldsList(
						source,
						blockContext
					);
					if ( fieldsList?.length ) {
						sourceFields[ sourceName ] = fieldsList;
					}
				}
			);
			return sourceFields;
		},
		[ blockContext ]
	);

	// Check if this attribute has compatible fields from any source.
	const attributeType = getAttributeType( blockName, attribute );

	const compatibleFieldsForAttribute = {};
	for ( const sourceKey in sources ) {
		const fields = sources[ sourceKey ].filter(
			( field ) => field.type === attributeType
		);
		if ( fields.length ) {
			compatibleFieldsForAttribute[ sourceKey ] = fields;
		}
	}

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
			compatibleFieldsForAttribute?.[ sourceName ]?.find( ( field ) =>
				fastDeepEqual( field.args, args )
			)?.label ||
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
