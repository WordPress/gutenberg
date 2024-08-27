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
import { useRegistry } from '@wordpress/data';
import { useContext, Fragment } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { store as preferencesStore } from '@wordpress/preferences';

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

const { DropdownMenuV2 } = unlock( componentsPrivateApis );

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
							<Text
								className="block-editor-bindings__source-label"
								upperCase
								variant="muted"
								aria-hidden
							>
								{ registeredSources[ name ].label }
							</Text>
						) }
						{ Object.entries( fields ).map( ( [ key, value ] ) => (
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
									{ key }
								</DropdownMenuV2.ItemLabel>
								<DropdownMenuV2.ItemHelpText>
									{ value }
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
	const { bindings } = metadata || {};
	const { removeAllBlockBindings } = useBlockBindingsUtils();
	const bindableAttributes = getBindableAttributes( blockName );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const filteredBindings = { ...bindings };
	Object.keys( filteredBindings ).forEach( ( key ) => {
		if (
			! canBindAttribute( blockName, key ) ||
			filteredBindings[ key ].source === 'core/pattern-overrides'
		) {
			delete filteredBindings[ key ];
		}
	} );

	const { showBlockBindingsUI } = useSelect( ( select ) => {
		const { get } = select( preferencesStore );

		return {
			showBlockBindingsUI: get( 'core', 'showBlockBindingsUI' ),
		};
	}, [] );

	if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
		return null;
	}

	const fieldsList = {};
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
				if ( sourceList ) {
					fieldsList[ sourceName ] = { ...sourceList };
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
		! showBlockBindingsUI || ! Object.keys( fieldsList ).length;

	if ( readOnly && Object.keys( filteredBindings ).length === 0 ) {
		return null;
	}

	return (
		<InspectorControls>
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
						/>
					) : (
						<EditableBlockBindingsPanelItems
							attributes={ bindableAttributes }
							bindings={ filteredBindings }
							fieldsList={ fieldsList }
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
