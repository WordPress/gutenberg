/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getBlockBindingsSource,
	getBlockBindingsSources,
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
import { useContext, cloneElement } from '@wordpress/element';
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

function BlockBindingsPanelDropdown( { attribute, binding } ) {
	const blockContext = useContext( BlockContext );
	const registeredSources = getBlockBindingsSources();
	// Get a new object with the rendered components to check if they are null.
	const sourcesComponents = Object.entries( registeredSources ).reduce(
		( acc, [ name, { render, usesContext } ] ) => {
			const context = {};
			if ( usesContext?.length ) {
				for ( const key of usesContext ) {
					context[ key ] = blockContext[ key ];
				}
			}

			if ( render ) {
				const SourceComponent = render( {
					context,
					attribute,
					binding,
				} );
				// Only add the component if it's not null.
				if ( SourceComponent ) {
					acc[ name ] = SourceComponent;
				}
			}

			return acc;
		},
		{}
	);

	// Return null if there are no components to render.
	if ( Object.keys( sourcesComponents ).length === 0 ) {
		return null;
	}

	return Object.entries( sourcesComponents ).map(
		( [ sourceName, SourceComponent ] ) => {
			return (
				<DropdownMenuV2
					key={ sourceName }
					// TODO: Review mobile version.
					placement="left-start"
					gutter={ 8 }
					trigger={
						<DropdownMenuV2.Item>
							{ registeredSources[ sourceName ].label }
						</DropdownMenuV2.Item>
					}
				>
					{ cloneElement( SourceComponent ) }
				</DropdownMenuV2>
			);
		}
	);
}

function BlockBindingsAttribute( { attribute, binding } ) {
	const blockContext = useContext( BlockContext );
	const { source: sourceName } = binding || {};
	const sourceProps = getBlockBindingsSource( sourceName );
	const isSourceInvalid = ! sourceProps;
	const bindingLabel = useSelect( ( select ) => {
		if ( isSourceInvalid ) {
			return;
		}
		// TODO: Explore if it makes sense to get the context in the parent component.
		const { usesContext } = sourceProps;
		const context = {};
		if ( usesContext?.length ) {
			for ( const key of usesContext ) {
				context[ key ] = blockContext[ key ];
			}
		}
		const _bindingsLabel = sourceProps?.getBindingLabel?.( {
			select,
			context,
			attribute,
			binding,
		} );
		return _bindingsLabel || sourceProps?.label || sourceName;
	} );
	return (
		<VStack className="block-editor-bindings__item" spacing={ 0 }>
			<Text truncate>{ attribute }</Text>
			{ !! binding && (
				<Text
					truncate
					variant={ ! isSourceInvalid && 'muted' }
					isDestructive={ isSourceInvalid }
				>
					{ isSourceInvalid ? __( 'Invalid source' ) : bindingLabel }
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

function EditableBlockBindingsPanelItems( { attributes, bindings } ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );
	return (
		<>
			{ attributes.map( ( attribute ) => {
				const binding = bindings[ attribute ];
				// Check if the DropdownComponent renders something that is valid and not null.
				// TODO: Look for a better way to do this.
				const DropdownComponent = (
					<BlockBindingsPanelDropdown
						attribute={ attribute }
						binding={ binding }
					/>
				);
				const renderedDropdown = DropdownComponent.type(
					DropdownComponent.props
				);

				// Return a non-dropdown item if the dropdown component is null.
				if ( ! renderedDropdown ) {
					return (
						<Item key={ attribute }>
							<BlockBindingsAttribute
								attribute={ attribute }
								binding={ binding }
							/>
						</Item>
					);
				}

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
									/>
								</Item>
							}
						>
							{ cloneElement( DropdownComponent ) }
						</DropdownMenuV2>
					</ToolsPanelItem>
				);
			} ) }
		</>
	);
}

export const BlockBindingsPanel = ( { name: blockName, metadata } ) => {
	const { removeAllBlockBindings } = useBlockBindingsUtils();
	const bindableAttributes = getBindableAttributes( blockName );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// Lock the UI when the user can't update bindings or there are no components.
	const readOnly = useSelect( ( select ) => {
		return ! select( blockEditorStore ).getSettings()
			.canUpdateBlockBindings;
	}, [] );
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
						/>
					) : (
						<EditableBlockBindingsPanelItems
							attributes={ bindableAttributes }
							bindings={ filteredBindings }
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
