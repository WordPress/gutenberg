/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalText as Text,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useRegistry, useSelect } from '@wordpress/data';
import { useContext, Fragment } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	canBindAttribute,
	getBindableAttributes,
} from '../hooks/use-bindings-attributes';
import { unlock } from '../lock-unlock';
import InspectorControls from '../components/inspector-controls';
import BlockContext from '../components/block-context';
import { useBlockBindingsUtils } from '../utils/block-bindings';
import { store as blockEditorStore } from '../store';

const { DropdownMenuV2 } = unlock( componentsPrivateApis );

const EMPTY_OBJECT = {};

const useToolsPanelDropdownMenuProps = () => {
	const isMobile = useViewportMatch( 'medium', '<' );
	return ! isMobile
		? {
				popoverProps: {
					placement: 'left-start',
					// For non-mobile, inner sidebar width (248px) - button width (24px) - border (1px) + padding (16px) + spacing (20px)
					offset: 259,
				},
		  }
		: {};
};

function BlockBindingsPanelDropdown( { fieldsList, attribute, binding } ) {
	const { getBlockBindingsSources } = unlock( blocksPrivateApis );
	const registeredSources = getBlockBindingsSources();
	const { updateBlockBindings } = useBlockBindingsUtils();
	const currentKey = binding?.args?.key;
	return (
		<>
			{ Object.entries( fieldsList ).map( ( [ name, fields ], i ) => (
				<Fragment key={ name }>
					<DropdownMenuV2.Group>
						{ Object.keys( fieldsList ).length > 1 && (
							<DropdownMenuV2.GroupLabel>
								{ registeredSources[ name ].label }
							</DropdownMenuV2.GroupLabel>
						) }
						{ Object.entries( fields ).map( ( [ key, args ] ) => (
							<DropdownMenuV2.RadioItem
								key={ key }
								onChange={ () =>
									updateBlockBindings( {
										[ attribute ]: {
											source: name,
											args: { key },
										},
									} )
								}
								name={ attribute + '-binding' }
								value={ key }
								checked={ key === currentKey }
							>
								<DropdownMenuV2.ItemLabel>
									{ args?.label }
								</DropdownMenuV2.ItemLabel>
								<DropdownMenuV2.ItemHelpText>
									{ args?.value }
								</DropdownMenuV2.ItemHelpText>
							</DropdownMenuV2.RadioItem>
						) ) }
					</DropdownMenuV2.Group>
					{ i !== Object.keys( fieldsList ).length - 1 && (
						<DropdownMenuV2.Separator />
					) }
				</Fragment>
			) ) }
		</>
	);
}

function BlockBindingsAttribute( { attribute, binding, fieldsList } ) {
	const { source: sourceName, args } = binding || {};
	const sourceProps =
		unlock( blocksPrivateApis ).getBlockBindingsSource( sourceName );
	const isSourceInvalid = ! sourceProps;
	return (
		<VStack className="block-editor-bindings__item" spacing={ 0 }>
			<Text truncate>{ attribute }</Text>
			{ !! binding && (
				<Text
					truncate
					variant={ ! isSourceInvalid && 'muted' }
					isDestructive={ isSourceInvalid }
				>
					{ isSourceInvalid
						? __( 'Invalid source' )
						: fieldsList?.[ sourceName ]?.[ args?.key ]?.label ||
						  sourceProps?.label ||
						  sourceName }
				</Text>
			) }
		</VStack>
	);
}

function ReadOnlyBlockBindingsPanelItems( { bindings, fieldsList } ) {
	return (
		<>
			{ Object.entries( bindings ).map( ( [ attribute, binding ] ) => (
				<Item key={ attribute }>
					<BlockBindingsAttribute
						attribute={ attribute }
						binding={ binding }
						fieldsList={ fieldsList }
					/>
				</Item>
			) ) }
		</>
	);
}

function EditableBlockBindingsPanelItems( {
	attributes,
	bindings,
	fieldsList,
} ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );
	return (
		<>
			{ attributes.map( ( attribute ) => {
				const binding = bindings[ attribute ];
				return (
					<ToolsPanelItem
						key={ attribute }
						hasValue={ () => !! binding }
						label={ attribute }
						onDeselect={ () => {
							updateBlockBindings( {
								[ attribute ]: undefined,
							} );
						} }
					>
						<DropdownMenuV2
							placement={
								isMobile ? 'bottom-start' : 'left-start'
							}
							gutter={ isMobile ? 8 : 36 }
							trigger={
								<Item>
									<BlockBindingsAttribute
										attribute={ attribute }
										binding={ binding }
										fieldsList={ fieldsList }
									/>
								</Item>
							}
						>
							<BlockBindingsPanelDropdown
								fieldsList={ fieldsList }
								attribute={ attribute }
								binding={ binding }
							/>
						</DropdownMenuV2>
					</ToolsPanelItem>
				);
			} ) }
		</>
	);
}

export const BlockBindingsPanel = ( { name: blockName, metadata } ) => {
	const registry = useRegistry();
	const blockContext = useContext( BlockContext );
	const { removeAllBlockBindings } = useBlockBindingsUtils();
	const bindableAttributes = getBindableAttributes( blockName );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// `useSelect` is used purposely here to ensure `getFieldsList`
	// is updated whenever there are updates in block context.
	// `source.getFieldsList` may also call a selector via `registry.select`.
	const _fieldsList = {};
	const { fieldsList, canUpdateBlockBindings } = useSelect(
		( select ) => {
			if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
				return EMPTY_OBJECT;
			}
			const { getBlockBindingsSources } = unlock( blocksPrivateApis );
			const registeredSources = getBlockBindingsSources();
			Object.entries( registeredSources ).forEach(
				( [ sourceName, { getFieldsList, usesContext } ] ) => {
					if ( getFieldsList ) {
						// Populate context.
						const context = {};
						if ( usesContext?.length ) {
							for ( const key of usesContext ) {
								context[ key ] = blockContext[ key ];
							}
						}
						const sourceList = getFieldsList( {
							registry,
							context,
						} );
						// Only add source if the list is not empty.
						if ( Object.keys( sourceList || {} ).length ) {
							_fieldsList[ sourceName ] = { ...sourceList };
						}
					}
				}
			);
			return {
				fieldsList:
					Object.values( _fieldsList ).length > 0
						? _fieldsList
						: EMPTY_OBJECT,
				canUpdateBlockBindings:
					select( blockEditorStore ).getSettings()
						.canUpdateBlockBindings,
			};
		},
		[ blockContext, bindableAttributes, registry ]
	);
	// Return early if there are no bindable attributes.
	if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
		return null;
	}
	// Filter bindings to only show bindable attributes and remove pattern overrides.
	const { bindings } = metadata || {};
	const filteredBindings = { ...bindings };
	Object.keys( filteredBindings ).forEach( ( key ) => {
		if (
			! canBindAttribute( blockName, key ) ||
			filteredBindings[ key ].source === 'core/pattern-overrides'
		) {
			delete filteredBindings[ key ];
		}
	} );

	// Lock the UI when the user can't update bindings or there are no fields to connect to.
	const readOnly =
		! canUpdateBlockBindings || ! Object.keys( fieldsList ).length;

	if ( readOnly && Object.keys( filteredBindings ).length === 0 ) {
		return null;
	}

	return (
		<InspectorControls group="bindings">
			<ToolsPanel
				label={ __( 'Attributes' ) }
				resetAll={ () => {
					removeAllBlockBindings();
				} }
				dropdownMenuProps={ dropdownMenuProps }
				className="block-editor-bindings__panel"
			>
				<ItemGroup isBordered isSeparated>
					{ readOnly ? (
						<ReadOnlyBlockBindingsPanelItems
							bindings={ filteredBindings }
							fieldsList={ fieldsList }
						/>
					) : (
						<EditableBlockBindingsPanelItems
							attributes={ bindableAttributes }
							bindings={ filteredBindings }
							fieldsList={ fieldsList }
						/>
					) }
				</ItemGroup>
				<ItemGroup>
					<Text variant="muted">
						{ __(
							'Attributes connected to custom fields or other dynamic data.'
						) }
					</Text>
				</ItemGroup>
			</ToolsPanel>
		</InspectorControls>
	);
};

export default {
	edit: BlockBindingsPanel,
	attributeKeys: [ 'metadata' ],
	hasSupport() {
		return true;
	},
};
