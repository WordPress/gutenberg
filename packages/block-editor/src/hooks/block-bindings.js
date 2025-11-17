/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getBlockBindingsSource,
	getBlockType,
	store as blockStore,
} from '@wordpress/blocks';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalText as Text,
	__experimentalToolsPanel as ToolsPanel,
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
import { useBlockBindingsUtils } from '../utils/block-bindings';
import { unlock } from '../lock-unlock';
import InspectorControls from '../components/inspector-controls';
import BlockContext from '../components/block-context';
import { useBlockEditContext } from '../components/block-edit';
import { store as blockEditorStore } from '../store';

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

function BlockBindingsPanelMenuContent( { attribute, binding, sources } ) {
	const { clientId } = useBlockEditContext();
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );
	const blockContext = useContext( BlockContext );
	const { attributeType, select } = useSelect(
		( _select ) => {
			const { name: blockName } =
				_select( blockEditorStore ).getBlock( clientId );
			return {
				attributeType: getAttributeType( blockName, attribute ),
				select: _select,
			};
		},
		[ clientId, attribute ]
	);
	return (
		<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
			{ Object.entries( sources ).map( ( [ sourceKey, data ] ) => {
				// Only show sources that have compatible data for this specific attribute.
				const sourceDataItems = data.filter(
					( item ) => item.type === attributeType
				);

				const noItemsAvailable =
					! sourceDataItems || sourceDataItems.length === 0;

				if ( noItemsAvailable ) {
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
								{ sourceDataItems.map( ( item ) => {
									const itemBindings = {
										source: sourceKey,
										args: item.args || {
											key: item.key,
										},
									};
									const values = source.getValues( {
										select,
										context: blockContext,
										bindings: {
											[ attribute ]: itemBindings,
										},
									} );
									return (
										<Menu.CheckboxItem
											key={
												sourceKey +
													JSON.stringify(
														item.args
													) || item.key
											}
											onChange={ () => {
												const isCurrentlySelected =
													fastDeepEqual(
														binding?.args,
														item.args
													) ??
													// Deprecate key dependency in 7.0.
													item.key ===
														binding?.args?.key;

												if ( isCurrentlySelected ) {
													// Unset if the same item is selected again.
													updateBlockBindings( {
														[ attribute ]:
															undefined,
													} );
												} else {
													updateBlockBindings( {
														[ attribute ]:
															itemBindings,
													} );
												}
											} }
											name={ attribute + '-binding' }
											value={ values[ attribute ] }
											checked={
												fastDeepEqual(
													binding?.args,
													item.args
												) ??
												// Deprecate key dependency in 7.0.
												item.key === binding?.args?.key
											}
										>
											<Menu.ItemLabel>
												{ item.label }
											</Menu.ItemLabel>
											<Menu.ItemHelpText>
												{ values[ attribute ] }
											</Menu.ItemHelpText>
										</Menu.CheckboxItem>
									);
								} ) }
							</Menu.Group>
						</Menu.Popover>
					</Menu>
				);
			} ) }
		</Menu>
	);
}

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

function ReadOnlyBlockBindingsPanelItem( {
	attribute,
	binding,
	sources,
	blockName,
} ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<ToolsPanelItem hasValue={ () => !! binding } label={ attribute }>
			<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
				<Menu.TriggerButton render={ <Item /> } disabled>
					<BlockBindingsAttribute
						attribute={ attribute }
						binding={ binding }
						sources={ sources }
						blockName={ blockName }
					/>
				</Menu.TriggerButton>
			</Menu>
		</ToolsPanelItem>
	);
}

function EditableBlockBindingsPanelItem( {
	attribute,
	binding,
	sources,
	blockName,
} ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<ToolsPanelItem
			hasValue={ () => !! binding }
			label={ attribute }
			onDeselect={ () => {
				updateBlockBindings( {
					[ attribute ]: undefined,
				} );
			} }
		>
			<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
				<Menu.TriggerButton render={ <Item /> }>
					<BlockBindingsAttribute
						attribute={ attribute }
						binding={ binding }
						sources={ sources }
						blockName={ blockName }
					/>
				</Menu.TriggerButton>
				<Menu.Popover gutter={ isMobile ? 8 : 36 }>
					<BlockBindingsPanelMenuContent
						attribute={ attribute }
						binding={ binding }
						sources={ sources }
					/>
				</Menu.Popover>
			</Menu>
		</ToolsPanelItem>
	);
}

export const BlockBindingsPanel = ( { name: blockName, metadata } ) => {
	const blockContext = useContext( BlockContext );
	const { removeAllBlockBindings } = useBlockBindingsUtils();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// Use useSelect to ensure sources are updated whenever there are updates in block context
	// or when underlying data changes.
	const { canUpdateBlockBindings, bindableAttributes } = useSelect(
		( select ) => {
			const { __experimentalBlockBindingsSupportedAttributes } =
				select( blockEditorStore ).getSettings();

			return {
				canUpdateBlockBindings:
					select( blockEditorStore ).getSettings()
						.canUpdateBlockBindings,
				bindableAttributes:
					__experimentalBlockBindingsSupportedAttributes?.[
						blockName
					],
			};
		},
		[ blockName ]
	);

	const sources = useSelect(
		( select ) => {
			const { getAllBlockBindingsSources } = unlock(
				select( blockStore )
			);
			const data = {};
			Object.entries( getAllBlockBindingsSources() ).forEach(
				( [ sourceName, source ] ) => {
					if ( ! source.getFieldsList ) {
						return;
					}

					const context = {};
					if ( source.usesContext?.length ) {
						for ( const key of source.usesContext ) {
							context[ key ] = blockContext[ key ];
						}
					}

					const items = source.getFieldsList( {
						select,
						context,
					} );
					if ( items?.length ) {
						data[ sourceName ] = items;
					}
				}
			);
			return data;
		},
		[ blockContext ]
	);

	// Return early if there are no bindable attributes.
	if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
		return null;
	}

	const { bindings } = metadata || {};

	const hasCompatibleData = Object.keys( sources ).length > 0;

	// Lock the UI when the user can't update bindings or there are no fields to connect to.
	const readOnly = ! canUpdateBlockBindings || ! hasCompatibleData;

	if ( bindings === undefined && ! hasCompatibleData ) {
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
					{ bindableAttributes.map( ( attribute ) => {
						const binding = bindings?.[ attribute ];

						// Check if this specific attribute has compatible data from any source.
						const attributeType = getAttributeType(
							blockName,
							attribute
						);

						const hasCompatibleDataForAttribute = Object.values(
							sources
						).some( ( data ) =>
							data.some( ( item ) => item.type === attributeType )
						);

						const isAttributeReadOnly =
							readOnly || ! hasCompatibleDataForAttribute;

						return isAttributeReadOnly ? (
							<ReadOnlyBlockBindingsPanelItem
								key={ attribute }
								attribute={ attribute }
								binding={ binding }
								sources={ sources }
								blockName={ blockName }
							/>
						) : (
							<EditableBlockBindingsPanelItem
								key={ attribute }
								attribute={ attribute }
								binding={ binding }
								sources={ sources }
								blockName={ blockName }
							/>
						);
					} ) }
				</ItemGroup>
				{ /*
					Use a div element to make the ToolsPanelHiddenInnerWrapper
					toggle the visibility of this help text automatically.
				*/ }
				<Text as="div" variant="muted">
					<p>
						{ __(
							'Attributes connected to custom fields or other dynamic data.'
						) }
					</p>
				</Text>
			</ToolsPanel>
		</InspectorControls>
	);
};

export default {
	edit: BlockBindingsPanel,
	attributeKeys: [ 'metadata' ],
	hasSupport( name ) {
		return ! [
			'core/post-date',
			'core/navigation-link',
			'core/navigation-submenu',
		].includes( name );
	},
};
