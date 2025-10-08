/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockBindingsSources, getBlockType } from '@wordpress/blocks';
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
	const isMobile = useViewportMatch( 'medium', '<' );
	const blockContext = useContext( BlockContext );
	const { attributeType, select } = useSelect(
		( _select ) => {
			const { name: blockName } =
				_select( blockEditorStore ).getBlock( clientId );
			const _attributeType =
				getBlockType( blockName ).attributes?.[ attribute ]?.type;
			return {
				attributeType:
					_attributeType === 'rich-text' ? 'string' : _attributeType,
				select: _select,
			};
		},
		[ clientId, attribute ]
	);
	return (
		<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
			{ Object.entries( sources ).map( ( [ sourceKey, source ] ) => {
				// Only show sources that have compatible data for this specific attribute.
				const sourceDataItems = source.data?.filter(
					( item ) => item?.type === attributeType
				);

				const noItemsAvailable =
					! sourceDataItems || sourceDataItems.length === 0;

				if ( source.mode === 'dropdown' ) {
					return (
						<Menu
							key={ sourceKey }
							placement={
								isMobile ? 'bottom-start' : 'left-start'
							}
						>
							{ noItemsAvailable ? (
								<Menu.Item disabled>{ source.label }</Menu.Item>
							) : (
								<Menu.SubmenuTriggerItem>
									<Menu.ItemLabel>
										{ source.label }
									</Menu.ItemLabel>
								</Menu.SubmenuTriggerItem>
							) }

							{ ! noItemsAvailable && (
								<Menu.Popover gutter={ 8 }>
									<Menu.Group>
										{ sourceDataItems.map( ( item ) => {
											const itemBindings = {
												source: sourceKey,
												args: item?.args || {
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
																binding?.args
																	?.key;

														if (
															isCurrentlySelected
														) {
															// Unset if the same item is selected again.
															updateBlockBindings(
																{
																	[ attribute ]:
																		undefined,
																}
															);
														} else {
															updateBlockBindings(
																{
																	[ attribute ]:
																		itemBindings,
																}
															);
														}
													} }
													name={
														attribute + '-binding'
													}
													value={
														values[ attribute ]
													}
													checked={
														fastDeepEqual(
															binding?.args,
															item.args
														) ??
														// Deprecate key dependency in 7.0.
														item.key ===
															binding?.args?.key
													}
												>
													<Menu.ItemLabel>
														{ item?.label }
													</Menu.ItemLabel>
													<Menu.ItemHelpText>
														{ values[ attribute ] }
													</Menu.ItemHelpText>
												</Menu.CheckboxItem>
											);
										} ) }
									</Menu.Group>
								</Menu.Popover>
							) }
						</Menu>
					);
				}

				if ( source.mode === 'modal' ) {
					return (
						<Menu.Item
							key={ sourceKey }
							onClick={ () => onOpenModal( { sourceKey } ) }
						>
							<Menu.ItemLabel>{ source.label }</Menu.ItemLabel>
						</Menu.Item>
					);
				}

				return null;
			} ) }
		</Menu>
	);
}

function BlockBindingsAttribute( { attribute, binding, source } ) {
	const { source: sourceName, args } = binding || {};
	const isSourceInvalid = ! source;
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
						: source?.data?.find( ( item ) =>
								fastDeepEqual( item.args, args )
						  )?.label ||
						  source?.label ||
						  sourceName }
				</Text>
			) }
		</VStack>
	);
}

function ReadOnlyBlockBindingsPanelItem( { attribute, binding, source } ) {
	return (
		<ToolsPanelItem hasValue={ () => !! binding } label={ attribute }>
			<Item>
				<BlockBindingsAttribute
					attribute={ attribute }
					binding={ binding }
					source={ source }
				/>
			</Item>
		</ToolsPanelItem>
	);
}

function EditableBlockBindingsPanelItem( {
	attribute,
	binding,
	sources,
	setModalState,
} ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );

	const handleOpenModal = ( { sourceKey } ) => {
		setModalState( { attribute, sourceKey } );
	};

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
						source={ sources?.[ binding?.source ] }
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
}

export const BlockBindingsPanel = ( { name: blockName, metadata } ) => {
	const blockContext = useContext( BlockContext );
	const { removeAllBlockBindings } = useBlockBindingsUtils();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const [ modalState, setModalState ] = useState( null );

	const handleCloseModal = () => {
		setModalState( null );
	};

	// Use useSelect to ensure sources are updated whenever there are updates in block context
	// or when underlying data changes.
	// Still needs a fix regarding _sources scope.
	const _sources = {};
	const { sources, canUpdateBlockBindings, bindableAttributes } = useSelect(
		( select ) => {
			const { __experimentalBlockBindingsSupportedAttributes } =
				select( blockEditorStore ).getSettings();
			const _bindableAttributes =
				__experimentalBlockBindingsSupportedAttributes?.[ blockName ];
			if ( ! _bindableAttributes || _bindableAttributes.length === 0 ) {
				return EMPTY_OBJECT;
			}

			const registeredSources = getBlockBindingsSources();
			Object.entries( registeredSources ).forEach(
				( [
					sourceName,
					{ editorUI, getFieldsList, usesContext, label, getValues },
				] ) => {
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
						const hasCompatibleData = _bindableAttributes.some(
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
								getValues,
							};
						}
					} else if ( getFieldsList ) {
						// Backward compatibility: Convert getFieldsList to editorUI format
						const context = {};
						if ( usesContext?.length ) {
							for ( const key of usesContext ) {
								context[ key ] = blockContext[ key ];
							}
						}

						const fieldsListResult = getFieldsList( {
							select,
							context,
						} );

						if ( fieldsListResult ) {
							// Convert getFieldsList format to editorUI format
							const data = Object.entries( fieldsListResult ).map(
								( [ key, field ] ) => ( {
									label: field.label || key,
									type: field.type || 'string',
									args: { key },
								} )
							);

							const hasCompatibleData = _bindableAttributes.some(
								( attribute ) => {
									const _attributeType =
										getBlockType( blockName ).attributes?.[
											attribute
										]?.type;
									const attributeType =
										_attributeType === 'rich-text'
											? 'string'
											: _attributeType;

									return data.some(
										( item ) => item?.type === attributeType
									);
								}
							);

							if ( hasCompatibleData ) {
								_sources[ sourceName ] = {
									mode: 'dropdown', // Default mode for backward compatibility
									data,
									label,
									getValues,
								};
							}
						}
					} else {
						/*
						 * Include sources without editorUI if they are introduced
						 * by other means (e.g. code editor).
						 */
						_sources[ sourceName ] = {
							label,
							getValues,
						};
					}
				}
			);

			return {
				sources:
					Object.values( _sources ).length > 0
						? _sources
						: EMPTY_OBJECT,
				canUpdateBlockBindings:
					select( blockEditorStore ).getSettings()
						.canUpdateBlockBindings,
				bindableAttributes: _bindableAttributes,
			};
		},
		[ blockContext, blockName ]
	);
	// Return early if there are no bindable attributes.
	if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
		return null;
	}
	// Filter bindings to only show bindable attributes.
	const { bindings } = metadata || {};
	const filteredBindings = { ...bindings };
	Object.keys( filteredBindings ).forEach( ( key ) => {
		if ( ! bindableAttributes.includes( key ) ) {
			delete filteredBindings[ key ];
		}
	} );

	// Lock the UI when the user can't update bindings or there are no fields to connect to.
	const readOnly =
		! canUpdateBlockBindings || ! Object.keys( sources ).length;

	if ( readOnly && Object.keys( filteredBindings ).length === 0 ) {
		return null;
	}

	const RenderModalContent =
		sources[ modalState?.sourceKey ]?.renderModalContent;

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
						const binding = filteredBindings[ attribute ];
						const hasCompatibleData = Object.values( sources ).some(
							( source ) => source.data
						);

						return readOnly || ! hasCompatibleData ? (
							<ReadOnlyBlockBindingsPanelItem
								key={ attribute }
								attribute={ attribute }
								binding={ binding }
								source={ sources?.[ binding?.source ] }
							/>
						) : (
							<EditableBlockBindingsPanelItem
								key={ attribute }
								attribute={ attribute }
								binding={ binding }
								sources={ sources }
								setModalState={ setModalState }
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
			{ RenderModalContent && (
				<Modal onRequestClose={ handleCloseModal }>
					<RenderModalContent
						attribute={ modalState.attribute }
						closeModal={ handleCloseModal }
					/>
				</Modal>
			) }
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
