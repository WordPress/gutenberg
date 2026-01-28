/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { getBlockBindingsSource } from '@wordpress/blocks';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useBlockBindingsUtils from './use-block-bindings-utils';
import { unlock } from '../../lock-unlock';
import BlockContext from '../block-context';

const { Menu } = unlock( componentsPrivateApis );

function BlockBindingsSourceFieldsListItem( {
	args,
	attribute,
	field,
	source,
	sourceKey,
} ) {
	const itemBindings = useMemo(
		() => ( {
			source: sourceKey,
			args: field.args || {
				key: field.key,
			},
		} ),
		[ field.args, field.key, sourceKey ]
	);

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
					fastDeepEqual( args, field.args ) ??
					// Deprecate key dependency in 7.0.
					field.key === args?.key;

				if ( isCurrentlySelected ) {
					// Unset if the same field is selected again.
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
				fastDeepEqual( args, field.args ) ??
				// Deprecate key dependency in 7.0.
				field.key === args?.key
			}
		>
			<Menu.ItemLabel>{ field.label }</Menu.ItemLabel>
			<Menu.ItemHelpText>{ values[ attribute ] }</Menu.ItemHelpText>
		</Menu.CheckboxItem>
	);
}

export default function BlockBindingsSourceFieldsList( {
	args,
	attribute,
	sourceKey,
	fields,
} ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	// Only render source if it has compatible fields.
	if ( ! fields || fields.length === 0 ) {
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
					{ fields.map( ( field ) => (
						<BlockBindingsSourceFieldsListItem
							key={
								sourceKey + JSON.stringify( field.args ) ||
								field.key
							}
							args={ args }
							attribute={ attribute }
							field={ field }
							source={ source }
							sourceKey={ sourceKey }
						/>
					) ) }
				</Menu.Group>
			</Menu.Popover>
		</Menu>
	);
}
