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
import { BlockBindingsDropdown } from '../components/block-bindings';
import BlockContext from '../components/block-context';
import { store as blockEditorStore } from '../store';

const { Menu } = unlock( componentsPrivateApis );

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

function BlockBindingsPanelMenuContent( { attribute, binding } ) {
	const sources = getBlockBindingsSources();
	const isMobile = useViewportMatch( 'medium', '<' );
	const blockContext = useContext( BlockContext );

	return (
		<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
			{ Object.entries( sources ).map( ( [ sourceKey, source ] ) => {
				if ( sourceKey === 'core/post-data' ) {
					const context = {};
					if ( source.usesContext?.length ) {
						for ( const key of source.usesContext ) {
							context[ key ] = blockContext[ key ];
						}
					}
					const EditorUI = source.editorUI;

					return (
						<EditorUI
							key={ sourceKey }
							attribute={ attribute }
							binding={ binding }
							source={ source }
							sourceKey={ sourceKey }
							context={ context }
						/>
					);
				}

				// FIXME: This is only here for now to avoid breaking other sources.
				// Remove once other sources are updated to the new format.
				return (
					<BlockBindingsDropdown
						key={ sourceKey }
						attribute={ attribute }
						binding={ binding }
						source={ source }
						sourceKey={ sourceKey }
					/>
				);
			} ) }
		</Menu>
	);
}

function BlockBindingsAttribute( { attribute, binding } ) {
	const { source: sourceName, args } = binding || {};
	const source = getBlockBindingsSource( sourceName );
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

function ReadOnlyBlockBindingsPanelItem( { attribute, binding } ) {
	return (
		<ToolsPanelItem hasValue={ () => !! binding } label={ attribute }>
			<Item>
				<BlockBindingsAttribute
					attribute={ attribute }
					binding={ binding }
				/>
			</Item>
		</ToolsPanelItem>
	);
}

function EditableBlockBindingsPanelItem( {
	attribute,
	binding,
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
					/>
				</Menu.TriggerButton>
				<Menu.Popover gutter={ isMobile ? 8 : 36 }>
					<BlockBindingsPanelMenuContent
						attribute={ attribute }
						binding={ binding }
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

	const registeredSources = getBlockBindingsSources();

	const { bindableAttributes } = useSelect(
		( select ) => {
			const { __experimentalBlockBindingsSupportedAttributes } =
				select( blockEditorStore ).getSettings();
			return {
				bindableAttributes:
					__experimentalBlockBindingsSupportedAttributes?.[
						blockName
					] ?? [],
			};
		},
		[ blockName ]
	);

	// Use useSelect to ensure sources are updated whenever there are updates in block context
	// or when underlying data changes.
	const { canUpdateBlockBindings } = useSelect(
		( select ) => {
			const _sources = {};
			Object.entries( registeredSources ).forEach(
				( [
					sourceName,
					{ editorUI, getFieldsList, usesContext, label, getValues },
				] ) => {
					// Populate context.
					const context = {};
					if ( usesContext?.length ) {
						for ( const key of usesContext ) {
							context[ key ] = blockContext[ key ];
						}
					}

					if ( editorUI && sourceName !== 'core/post-data' ) {
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
								getValues,
							};
						}
					} else if ( getFieldsList ) {
						// Backward compatibility: Convert getFieldsList to editorUI format
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
				canUpdateBlockBindings:
					select( blockEditorStore ).getSettings()
						.canUpdateBlockBindings,
			};
		},
		[ blockContext, blockName, registeredSources, bindableAttributes ]
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
	const readOnly = ! canUpdateBlockBindings; // || ! Object.keys( sources ).length; // FIXME

	if ( readOnly && Object.keys( filteredBindings ).length === 0 ) {
		return null;
	}

	const RenderModalContent = getBlockBindingsSource(
		modalState?.sourceKey
	)?.renderModalContent;

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
						const hasCompatibleData = true;
						// Object.values( sources ).some(
						// 	( source ) => source.data
						// );

						return readOnly || ! hasCompatibleData ? (
							<ReadOnlyBlockBindingsPanelItem
								key={ attribute }
								attribute={ attribute }
								binding={ binding }
							/>
						) : (
							<EditableBlockBindingsPanelItem
								key={ attribute }
								attribute={ attribute }
								binding={ binding }
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
