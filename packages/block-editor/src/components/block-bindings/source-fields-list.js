/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { getBlockBindingsSource } from '@wordpress/blocks';
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

const { Menu } = unlock( componentsPrivateApis );

function BlockBindingsSourceFieldsListItem( {
	args,
	attribute,
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
					fastDeepEqual( args, item.args ) ??
					// Deprecate key dependency in 7.0.
					item.key === args?.key;

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
				fastDeepEqual( args, item.args ) ??
				// Deprecate key dependency in 7.0.
				item.key === args?.key
			}
		>
			<Menu.ItemLabel>{ item.label }</Menu.ItemLabel>
			<Menu.ItemHelpText>{ values[ attribute ] }</Menu.ItemHelpText>
		</Menu.CheckboxItem>
	);
}

export default function BlockBindingsSourceFieldsList( {
	args,
	attribute,
	sourceKey,
	data,
} ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	// Only render source if it has compatible data.
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
						<BlockBindingsSourceFieldsListItem
							key={
								sourceKey + JSON.stringify( item.args ) ||
								item.key
							}
							args={ args }
							attribute={ attribute }
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
