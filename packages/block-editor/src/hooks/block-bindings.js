/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getBlockBindingsSource,
	getBlockBindingsSources,
	getBlockType,
} from '@wordpress/blocks';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalText as Text,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
	Modal,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useContext, useState } from '@wordpress/element';
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

function BlockBindingsPanelMenuContent( {
	attribute,
	binding,
	sources,
	onOpenModal,
} ) {
	const { clientId } = useBlockEditContext();
	const { updateBlockBindings } = useBlockBindingsUtils();
	const currentKey = binding?.args?.key;
	const isMobile = useViewportMatch( 'medium', '<' );
	const attributeType = useSelect(
		( select ) => {
			const { name: blockName } =
				select( blockEditorStore ).getBlock( clientId );
			const _attributeType =
				getBlockType( blockName ).attributes?.[ attribute ]?.type;
			return _attributeType === 'rich-text' ? 'string' : _attributeType;
		},
		[ clientId, attribute ]
	);

	return (
		<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
			{ Object.entries( sources )
				.filter( ( [ , source ] ) => {
					// Only show sources that have compatible data for this specific attribute.
					const sourceDataItems = source.data?.filter(
						( item ) => item?.type === attributeType
					);
					return sourceDataItems && sourceDataItems.length > 0;
				} )
				.map( ( [ sourceKey, source ] ) => {
					if ( source.mode === 'dropdown' ) {
						return (
							<Menu key={ sourceKey }>
								<Menu.SubmenuTriggerItem>
									<Menu.ItemLabel>
										{ source.label }
									</Menu.ItemLabel>
								</Menu.SubmenuTriggerItem>
								<Menu.Popover gutter={ 8 }>
									<Menu.Group>
										{ source.data
											?.filter(
												( item ) =>
													item?.type === attributeType
											)
											.map( ( item ) => (
												<Menu.RadioItem
													key={ item.key }
													onChange={ () => {
														updateBlockBindings( {
															[ attribute ]: {
																source: sourceKey,
																args: {
																	key: item.key,
																},
															},
														} );
													} }
													name={
														attribute + '-binding'
													}
													value={ item.key }
													checked={
														item.key === currentKey
													}
												>
													<Menu.ItemLabel>
														{ item?.label }
													</Menu.ItemLabel>
													<Menu.ItemHelpText>
														{ item?.value }
													</Menu.ItemHelpText>
												</Menu.RadioItem>
											) ) }
									</Menu.Group>
								</Menu.Popover>
							</Menu>
						);
					}

					if ( source.mode === 'modal' ) {
						return (
							<Menu.Item
								key={ sourceKey }
								onClick={ () =>
									onOpenModal( { attribute, sourceKey } )
								}
							>
								<Menu.ItemLabel>
									{ source.label }
								</Menu.ItemLabel>
							</Menu.Item>
						);
					}

					return null;
				} ) }
		</Menu>
	);
}

function BlockBindingsAttribute( { attribute, binding, sources } ) {
	const { source: sourceName, args } = binding || {};
	const sourceProps = getBlockBindingsSource( sourceName );
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
						: sources?.[ sourceName ]?.data?.find(
								( item ) => item.key === args?.key
						  )?.label ||
						  sources?.[ sourceName ]?.label ||
						  sourceProps?.label ||
						  sourceName }
				</Text>
			) }
		</VStack>
	);
}

function ReadOnlyBlockBindingsPanelItems( { bindings, sources } ) {
	return (
		<>
			{ Object.entries( bindings ).map( ( [ attribute, binding ] ) => (
				<Item key={ attribute }>
					<BlockBindingsAttribute
						attribute={ attribute }
						binding={ binding }
						sources={ sources }
					/>
				</Item>
			) ) }
		</>
	);
}

function EditableBlockBindingsPanelItems( { attributes, bindings, sources } ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );
	const [ modalState, setModalState ] = useState( null );

	const handleOpenModal = ( { attribute, sourceKey } ) => {
		setModalState( { attribute, sourceKey } );
	};

	const handleCloseModal = () => {
		setModalState( null );
	};

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
						<Menu
							placement={
								isMobile ? 'bottom-start' : 'left-start'
							}
						>
							<Menu.TriggerButton render={ <Item /> }>
								<BlockBindingsAttribute
									attribute={ attribute }
									binding={ binding }
									sources={ sources }
								/>
							</Menu.TriggerButton>
							<Menu.Popover gutter={ isMobile ? 8 : 36 }>
								<BlockBindingsPanelMenuContent
									attribute={ attribute }
									binding={ binding }
									sources={ sources }
									onOpenModal={ handleOpenModal }
								/>
							</Menu.Popover>
						</Menu>
					</ToolsPanelItem>
				);
			} ) }
			{ modalState && (
				<Modal onRequestClose={ handleCloseModal }>
					{ sources[ modalState.sourceKey ].renderModalContent( {
						attribute: modalState.attribute,
					} ) }
				</Modal>
			) }
		</>
	);
}

export const BlockBindingsPanel = ( { name: blockName, metadata } ) => {
	const blockContext = useContext( BlockContext );
	const { removeAllBlockBindings } = useBlockBindingsUtils();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// Use useSelect to ensure sources are updated whenever there are updates in block context
	// or when underlying data changes.
	const _sources = {};
	const { sources, canUpdateBlockBindings } = useSelect(
		( select ) => {
			const _canUpdateBlockBindings =
				select( blockEditorStore ).getSettings().canUpdateBlockBindings;

			if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
				return {
					sources: EMPTY_OBJECT,
					canUpdateBlockBindings: _canUpdateBlockBindings,
				};
			}

			const registeredSources = getBlockBindingsSources();
			Object.entries( registeredSources ).forEach(
				( [ sourceName, { editorUI, usesContext, label } ] ) => {
					if ( editorUI ) {
						// Populate context.
						const context = {};
						if ( usesContext?.length ) {
							for ( const key of usesContext ) {
								context[ key ] = blockContext[ key ];
							}
						}

						const editorUIResult = editorUI( {
							select,
							context,
						} );
						const hasCompatibleData = bindableAttributes.some(
							( attribute ) => {
								const _attributeType =
									getBlockType( blockName ).attributes?.[
										attribute
									]?.type;
								const attributeType =
									_attributeType === 'rich-text'
										? 'string'
										: _attributeType;

								return editorUIResult.data?.some(
									( item ) => item?.type === attributeType
								);
							}
						);

						if ( hasCompatibleData ) {
							_sources[ sourceName ] = {
								...editorUIResult,
								label,
							};
						}
					}
				}
			);

			return {
				sources:
					Object.values( _sources ).length > 0
						? _sources
						: EMPTY_OBJECT,
				canUpdateBlockBindings: _canUpdateBlockBindings,
			};
		},
		[ blockContext, bindableAttributes, blockName ]
	);
	// Return early if there are no bindable attributes.
	if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
		return null;
	}
	// Filter bindings to only show bindable attributes.
	const { bindings } = metadata || {};
	const filteredBindings = { ...bindings };
	Object.keys( filteredBindings ).forEach( ( key ) => {
		if ( ! canBindAttribute( blockName, key ) ) {
			delete filteredBindings[ key ];
		}
	} );

	// Lock the UI when the user can't update bindings or there are no fields to connect to.
	const readOnly =
		! canUpdateBlockBindings || ! Object.keys( sources ).length;

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
							sources={ sources }
						/>
					) : (
						<EditableBlockBindingsPanelItems
							attributes={ bindableAttributes }
							bindings={ filteredBindings }
							sources={ sources }
						/>
					) }
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
	hasSupport() {
		return true;
	},
};
