import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import { getBlockBindingsSource } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import useBlockBindingsUtils from './use-block-bindings-utils';
import BlockContext from '../block-context';
import type {
	BlockBindingsField,
	BlockBindingsSourceFieldsListItemProps,
	BlockBindingsSourceFieldsListProps,
} from './types';

function BlockBindingsSourceFieldsListItem( {
	args,
	attribute,
	field,
	source,
	sourceKey,
}: BlockBindingsSourceFieldsListItemProps ) {
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
			// A source offering fields provides their values.
			source.getValues!( {
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
			onCheckedChange={ ( checked ) => {
				updateBlockBindings( {
					[ attribute ]: checked ? itemBindings : undefined,
				} );
			} }
			checked={
				fastDeepEqual( args, field.args ) ??
				// Deprecate key dependency in 7.0.
				field.key === args?.key
			}
		>
			<Menu.ItemLabel>{ field.label }</Menu.ItemLabel>
			<Menu.ItemDescription>{ values[ attribute ] }</Menu.ItemDescription>
		</Menu.CheckboxItem>
	);
}

export default function BlockBindingsSourceFieldsList( {
	args,
	attribute,
	sourceKey,
	fields,
}: BlockBindingsSourceFieldsListProps ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	// Only render source if it has compatible fields.
	if ( ! fields || fields.length === 0 ) {
		return null;
	}

	// Fields come from a registered source.
	const source = getBlockBindingsSource( sourceKey )!;

	return (
		<Menu.SubmenuRoot key={ sourceKey }>
			<Menu.SubmenuTrigger>
				<Menu.ItemLabel>{ source.label }</Menu.ItemLabel>
			</Menu.SubmenuTrigger>
			<Menu.Popup
				positioner={
					<Menu.Positioner
						side={ isMobile ? 'bottom' : 'inline-start' }
						align="start"
						sideOffset={ 8 }
						alignOffset={ -4 }
					/>
				}
			>
				<Menu.Group>
					{ fields.map( ( field: BlockBindingsField ) => (
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
			</Menu.Popup>
		</Menu.SubmenuRoot>
	);
}
