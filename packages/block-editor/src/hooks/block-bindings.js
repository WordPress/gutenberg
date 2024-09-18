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
	__experimentalTruncate as Truncate,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useContext, Fragment } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	canBindAttribute,
	getBindableAttributes,
} from '../hooks/use-bindings-attributes';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import InspectorControls from '../components/inspector-controls';
import BlockContext from '../components/block-context';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuRadioItemV2: DropdownMenuRadioItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	DropdownMenuItemHelpTextV2: DropdownMenuItemHelpText,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
} = unlock( componentsPrivateApis );

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

function BlockBindingsPanelDropdown( {
	fieldsList,
	addConnection,
	attribute,
	binding,
} ) {
	const currentKey = binding?.args?.key;
	return (
		<>
			{ Object.entries( fieldsList ).map( ( [ label, fields ], i ) => (
				<Fragment key={ label }>
					<DropdownMenuGroup>
						{ Object.keys( fieldsList ).length > 1 && (
							<Text
								className="block-editor-bindings__source-label"
								upperCase
								variant="muted"
								aria-hidden
							>
								{ label }
							</Text>
						) }
						{ Object.entries( fields ).map( ( [ key, value ] ) => (
							<DropdownMenuRadioItem
								key={ key }
								onChange={ () =>
									addConnection( key, attribute )
								}
								name={ attribute + '-binding' }
								value={ key }
								checked={ key === currentKey }
							>
								<DropdownMenuItemLabel>
									{ key }
								</DropdownMenuItemLabel>
								<DropdownMenuItemHelpText>
									{ value }
								</DropdownMenuItemHelpText>
							</DropdownMenuRadioItem>
						) ) }
					</DropdownMenuGroup>
					{ i !== Object.keys( fieldsList ).length - 1 && (
						<DropdownMenuSeparator />
					) }
				</Fragment>
			) ) }
		</>
	);
}

function BlockBindingsAttribute( { attribute, binding } ) {
	const { source: sourceName, args } = binding || {};
	const sourceProps =
		unlock( blocksPrivateApis ).getBlockBindingsSource( sourceName );
	return (
		<VStack>
			<Truncate>{ attribute }</Truncate>
			{ !! binding && (
				<Text
					variant="muted"
					className="block-editor-bindings__item-explanation"
				>
					<Truncate>
						{ args?.key || sourceProps?.label || sourceName }
					</Truncate>
				</Text>
			) }
		</VStack>
	);
}

function ReadOnlyBlockBindingsPanelItems( { bindings } ) {
	return (
		<>
			{ Object.entries( bindings ).map( ( [ attribute, binding ] ) => (
				<Item key={ attribute }>
					<BlockBindingsAttribute
						attribute={ attribute }
						binding={ binding }
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
	addConnection,
	removeConnection,
} ) {
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
							removeConnection( attribute );
						} }
					>
						<DropdownMenu
							placement={
								isMobile ? 'bottom-start' : 'left-start'
							}
							gutter={ isMobile ? 8 : 36 }
							className="block-editor-bindings__popover"
							trigger={
								<Item>
									<BlockBindingsAttribute
										attribute={ attribute }
										binding={ binding }
									/>
								</Item>
							}
						>
							<BlockBindingsPanelDropdown
								fieldsList={ fieldsList }
								addConnection={ addConnection }
								attribute={ attribute }
								binding={ binding }
							/>
						</DropdownMenu>
					</ToolsPanelItem>
				);
			} ) }
		</>
	);
}

export const BlockBindingsPanel = ( { name, metadata } ) => {
	const registry = useRegistry();
	const blockContext = useContext( BlockContext );
	const { bindings } = metadata || {};

	const bindableAttributes = getBindableAttributes( name );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const filteredBindings = { ...bindings };
	Object.keys( filteredBindings ).forEach( ( key ) => {
		if (
			! canBindAttribute( name, key ) ||
			filteredBindings[ key ].source === 'core/pattern-overrides'
		) {
			delete filteredBindings[ key ];
		}
	} );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { _id } = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( blockEditorStore );

		return {
			_id: getSelectedBlockClientId(),
		};
	}, [] );

	if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
		return null;
	}

	const removeAllConnections = () => {
		const newMetadata = { ...metadata };
		delete newMetadata.bindings;
		updateBlockAttributes( _id, {
			metadata:
				Object.keys( newMetadata ).length === 0
					? undefined
					: newMetadata,
		} );
	};

	const addConnection = ( value, attribute ) => {
		// Assuming the block expects a flat structure for its metadata attribute
		const newMetadata = {
			...metadata,
			// Adjust this according to the actual structure expected by your block
			bindings: {
				...metadata?.bindings,
				[ attribute ]: {
					source: 'core/post-meta',
					args: { key: value },
				},
			},
		};
		// Update the block's attributes with the new metadata
		updateBlockAttributes( _id, {
			metadata: newMetadata,
		} );
	};

	const removeConnection = ( key ) => {
		const newMetadata = { ...metadata };
		if ( ! newMetadata.bindings ) {
			return;
		}

		delete newMetadata.bindings[ key ];
		if ( Object.keys( newMetadata.bindings ).length === 0 ) {
			delete newMetadata.bindings;
		}
		updateBlockAttributes( _id, {
			metadata:
				Object.keys( newMetadata ).length === 0
					? undefined
					: newMetadata,
		} );
	};

	const fieldsList = {};
	const { getBlockBindingsSources } = unlock( blocksPrivateApis );
	const registeredSources = getBlockBindingsSources();
	Object.values( registeredSources ).forEach(
		( { getFieldsList, label, usesContext } ) => {
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
				if ( sourceList ) {
					fieldsList[ label ] = { ...sourceList };
				}
			}
		}
	);
	// Remove empty sources.
	Object.entries( fieldsList ).forEach( ( [ key, value ] ) => {
		if ( ! Object.keys( value ).length ) {
			delete fieldsList[ key ];
		}
	} );

	// Lock the UI when the experiment is not enabled or there are no fields to connect to.
	const readOnly =
		! window.__experimentalBlockBindingsUI ||
		! Object.keys( fieldsList ).length;

	if ( readOnly && Object.keys( filteredBindings ).length === 0 ) {
		return null;
	}

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Attributes' ) }
				resetAll={ () => {
					removeAllConnections();
				} }
				dropdownMenuProps={ dropdownMenuProps }
				className="block-editor-bindings__panel"
			>
				<ItemGroup isBordered isSeparated>
					{ readOnly ? (
						<ReadOnlyBlockBindingsPanelItems
							bindings={ filteredBindings }
						/>
					) : (
						<EditableBlockBindingsPanelItems
							attributes={ bindableAttributes }
							bindings={ filteredBindings }
							fieldsList={ fieldsList }
							addConnection={ addConnection }
							removeConnection={ removeConnection }
						/>
					) }
				</ItemGroup>
				<Text variant="muted">
					{ __( 'Attributes connected to various sources.' ) }
				</Text>
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
