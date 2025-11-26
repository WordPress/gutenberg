/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { getBlockBindingsSource, getBlockType } from '@wordpress/blocks';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useBlockBindingsUtils } from '../../utils/block-bindings';
import { unlock } from '../../lock-unlock';
import BlockContext from '../block-context';
import { useBlockEditContext } from '../block-edit';
import { store as blockEditorStore } from '../../store';

const { Menu } = unlock( componentsPrivateApis );

/**
 * Get the normalized attribute type for block bindings.
 * Converts 'rich-text' to 'string' since rich-text is stored as string.
 *
 * @param {string} blockName The block name.
 * @param {string} attribute The attribute name.
 * @return {string} The normalized attribute type.
 */
export const getAttributeType = ( blockName, attribute ) => {
	const _attributeType =
		getBlockType( blockName ).attributes?.[ attribute ]?.type;
	return _attributeType === 'rich-text' ? 'string' : _attributeType;
};

function BlockBindingsSourceMenuItem( {
	attribute,
	binding,
	item,
	source,
	sourceKey,
} ) {
	const itemBindings = {
		source: sourceKey,
		args: item.args || {
			key: item.key,
		},
	};

	const blockContext = useContext( BlockContext );
	const values = useSelect(
		( select ) =>
			source.getValues( {
				select,
				context: blockContext,
				bindings: {
					[ attribute ]: itemBindings,
				},
			} ),
		[ attribute, blockContext, itemBindings, source ]
	);
	const { updateBlockBindings } = useBlockBindingsUtils();

	return (
		<Menu.CheckboxItem
			onChange={ () => {
				const isCurrentlySelected =
					fastDeepEqual( binding?.args, item.args ) ??
					// Deprecate key dependency in 7.0.
					item.key === binding?.args?.key;

				if ( isCurrentlySelected ) {
					// Unset if the same item is selected again.
					updateBlockBindings( {
						[ attribute ]: undefined,
					} );
				} else {
					updateBlockBindings( {
						[ attribute ]: itemBindings,
					} );
				}
			} }
			name={ attribute + '-binding' }
			value={ values[ attribute ] }
			checked={
				fastDeepEqual( binding?.args, item.args ) ??
				// Deprecate key dependency in 7.0.
				item.key === binding?.args?.key
			}
		>
			<Menu.ItemLabel>{ item.label }</Menu.ItemLabel>
			<Menu.ItemHelpText>{ values[ attribute ] }</Menu.ItemHelpText>
		</Menu.CheckboxItem>
	);
}

function BlockBindingsSourceMenu( { attribute, binding, sourceKey, data } ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	// Only render source if it has compatible data for this specific attribute.
	if ( ! data || data.length === 0 ) {
		return null;
	}

	const source = getBlockBindingsSource( sourceKey );

	return (
		<Menu
			key={ sourceKey }
			placement={ isMobile ? 'bottom-start' : 'left-start' }
		>
			<Menu.SubmenuTriggerItem>
				<Menu.ItemLabel>{ source.label }</Menu.ItemLabel>
			</Menu.SubmenuTriggerItem>
			<Menu.Popover gutter={ 8 }>
				<Menu.Group>
					{ data.map( ( item ) => (
						<BlockBindingsSourceMenuItem
							key={
								sourceKey + JSON.stringify( item.args ) ||
								item.key
							}
							attribute={ attribute }
							binding={ binding }
							item={ item }
							source={ source }
							sourceKey={ sourceKey }
						/>
					) ) }
				</Menu.Group>
			</Menu.Popover>
		</Menu>
	);
}

export default function BlockBindingsPanelMenuContent( {
	attribute,
	binding,
	sources,
} ) {
	const { clientId } = useBlockEditContext();
	const isMobile = useViewportMatch( 'medium', '<' );
	const { attributeType } = useSelect(
		( select ) => {
			const { name: blockName } =
				select( blockEditorStore ).getBlock( clientId );
			return {
				attributeType: getAttributeType( blockName, attribute ),
			};
		},
		[ clientId, attribute ]
	);
	return (
		<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
			{ Object.entries( sources ).map( ( [ sourceKey, data ] ) => {
				const sourceDataItems = data.filter(
					( item ) => item.type === attributeType
				);

				return (
					<BlockBindingsSourceMenu
						key={ sourceKey }
						attribute={ attribute }
						binding={ binding }
						sourceKey={ sourceKey }
						data={ sourceDataItems }
					/>
				);
			} ) }
		</Menu>
	);
}
