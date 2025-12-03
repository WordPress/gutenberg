/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
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
	field,
	source,
	sourceKey,
} ) {
	const itemBindings = {
		source: sourceKey,
		args: field.args || {
			key: field.key,
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
	blockName,
	sourceKey,
} ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	const blockContext = useContext( BlockContext );
	const { attributeType, source, fields } = useSelect(
		( select ) => {
			const {
				getBlockBindingsSource,
				getBlockBindingsSourceFieldsList,
				getBlockType,
			} = unlock( select( blocksStore ) );

			const _attributeType =
				getBlockType( blockName ).attributes?.[ attribute ]?.type;

			const _source = getBlockBindingsSource( sourceKey );
			const fieldsList = getBlockBindingsSourceFieldsList(
				_source,
				blockContext
			);
			return {
				attributeType:
					_attributeType === 'rich-text' ? 'string' : _attributeType,
				fields: fieldsList?.length ? fieldsList : [],
				source: _source,
			};
		},
		[ attribute, blockName, blockContext, sourceKey ]
	);

	const compatibleFields = fields.filter(
		( field ) => field.type === attributeType
	);

	// Only render source if it has compatible fields.
	if ( ! compatibleFields.length ) {
		return null;
	}

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
					{ compatibleFields.map( ( field ) => (
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
