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
/**
 * External dependencies
 */
import { A } from 'storybook/internal/components';

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

function BlockBindingsPanelMenuContent( { attribute, binding, data, mode } ) {
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
		<>
			{ Object.entries( data ).map( ( [ sourceKey, entries ] ) => {
				if ( mode[ sourceKey ] === 'dropdown' ) {
					return (
						<Menu
							key={ sourceKey }
							placement={
								isMobile ? 'bottom-start' : 'left-start'
							}
						>
							<Menu.SubmenuTriggerItem>
								<Menu.ItemLabel>{ sourceKey }</Menu.ItemLabel>
							</Menu.SubmenuTriggerItem>
							<Menu.Popover gutter={ 8 }>
								<>
									{ entries && entries.length > 0 && (
										<Menu.Group>
											{ Object.entries( entries )
												.filter(
													( [ , args ] ) =>
														args?.type ===
														attributeType
												)
												.map( ( [ , args ] ) => (
													<Menu.RadioItem
														key={ args.key }
														onChange={ ( a ) => {
															console.log(
																'a',
																a
															);
														} }
														name={
															attribute +
															'-binding'
														}
														value={ args.key }
														checked={
															args.key ===
															currentKey
														}
													>
														<Menu.ItemLabel>
															{ args?.label }
														</Menu.ItemLabel>
														<Menu.ItemHelpText>
															{ args?.value }
														</Menu.ItemHelpText>
													</Menu.RadioItem>
												) ) }
										</Menu.Group>
									) }
								</>
							</Menu.Popover>
						</Menu>
					);
				}
				return null;
			} ) }
		</>
	);
}

function BlockBindingsAttribute( { attribute, binding, data } ) {
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
						: data?.[ sourceName ]?.[ args?.key ]?.label ||
						  sourceProps?.label ||
						  sourceName }
				</Text>
			) }
		</VStack>
	);
}

function ReadOnlyBlockBindingsPanelItems( { bindings, data } ) {
	return (
		<>
			{ Object.entries( bindings ).map( ( [ attribute, binding ] ) => (
				<Item key={ attribute }>
					<BlockBindingsAttribute
						attribute={ attribute }
						binding={ binding }
						data={ data }
					/>
				</Item>
			) ) }
		</>
	);
}

function EditableBlockBindingsPanelItems( {
	attributes,
	bindings,
	data,
	mode,
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
						<Menu
							placement={
								isMobile ? 'bottom-start' : 'left-start'
							}
						>
							<Menu.TriggerButton render={ <Item /> }>
								<BlockBindingsAttribute
									attribute={ attribute }
									binding={ binding }
									data={ data }
								/>
							</Menu.TriggerButton>
							<Menu.Popover gutter={ isMobile ? 8 : 36 }>
								<BlockBindingsPanelMenuContent
									attribute={ attribute }
									binding={ binding }
									data={ data }
									mode={ mode }
								/>
							</Menu.Popover>
						</Menu>
					</ToolsPanelItem>
				);
			} ) }
		</>
	);
}

export const BlockBindingsPanel = ( { name: blockName, metadata } ) => {
	const blockContext = useContext( BlockContext );
	const { removeAllBlockBindings } = useBlockBindingsUtils();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// `useSelect` is used purposely here to ensure `getFieldsList`
	// is updated whenever there are updates in block context.
	// `source.getFieldsList` may also call a selector via `select`.
	const _data = {};
	const _mode = {};
	const _sources = {};
	const { canUpdateBlockBindings, data, mode } = useSelect(
		( select ) => {
			if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
				return {
					fieldsList: EMPTY_OBJECT,
				};
			}
			const registeredSources = getBlockBindingsSources();
			console.log( 'registered sources:', registeredSources );
			Object.entries( registeredSources ).forEach(
				( [ sourceName, { editorUI, usesContext } ] ) => {
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
						// Only add source if the list is not empty.
						if ( Object.keys( editorUIResult.data || {} ).length ) {
							_sources[ sourceName ] = {
								...editorUIResult,
							};
						}
					}
				}
			);
			return {
				data: Object.values( _data ).length > 0 ? _data : EMPTY_OBJECT,
				canUpdateBlockBindings:
					select( blockEditorStore ).getSettings()
						.canUpdateBlockBindings,
				mode: _mode,
			};
		},
		[ blockContext, bindableAttributes ]
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
	const readOnly = ! canUpdateBlockBindings || ! Object.keys( data ).length;

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
							data={ data }
						/>
					) : (
						<EditableBlockBindingsPanelItems
							attributes={ bindableAttributes }
							bindings={ filteredBindings }
							data={ data }
							mode={ mode }
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
