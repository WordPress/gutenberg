/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import {
	MenuGroup,
	MenuItem,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalHStack as Hstack,
	__experimentalTruncate as Truncate,
	__experimentalItemGroup as ItemGroup,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	Dropdown,
	Button,
	Icon,
} from '@wordpress/components';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { chevronRightSmall, customPostType } from '@wordpress/icons';
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

const popoverProps = {
	placement: 'left-start',
	offset: 36,
	shift: true,
	className: 'block-editor-block-bindings__popover',
	headerTitle: __( 'Custom Fields' ),
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

function BlockBindingsPanelDropdown( {
	fieldsList,
	addConnection,
	attribute,
} ) {
	return (
		<DropdownContentWrapper paddingSize="small">
			{ Object.entries( fieldsList ).map( ( [ label, fields ] ) => (
				<MenuGroup key={ label } label={ label }>
					{ Object.entries( fields ).map( ( [ key, value ] ) => (
						<MenuItem
							className="components-panel__block-bindings-panel-item"
							key={ key }
							onClick={ () => addConnection( key, attribute ) }
							icon={ <Icon icon={ customPostType } /> }
							iconPosition="left"
							suffix={
								<Truncate
									numberOfLines={ 1 }
									ellipsis="…"
									className="components-panel__block-bindings-panel-item-source"
								>
									{ value }
								</Truncate>
							}
						>
							<Truncate numberOfLines={ 1 } ellipsis="…">
								{ key }
							</Truncate>
						</MenuItem>
					) ) }
				</MenuGroup>
			) ) }
		</DropdownContentWrapper>
	);
}

function BlockBindingsAttribute( {
	toggleProps,
	attribute,
	filteredBindings,
} ) {
	return (
		<ItemGroup>
			<Button { ...toggleProps }>
				<Hstack align="center" justify="flex-start" expanded={ false }>
					<Icon icon={ customPostType } />
					<Truncate numberOfLines={ 1 } ellipsis="…">
						{ attribute }
					</Truncate>
					{ !! filteredBindings[ attribute ] && (
						<>
							<Icon icon={ chevronRightSmall } />
							<Truncate
								numberOfLines={ 1 }
								ellipsis="…"
								className="components-panel__block-bindings-panel-item-source"
							>
								{ filteredBindings[ attribute ]?.args?.key }
							</Truncate>
						</>
					) }
				</Hstack>
			</Button>
		</ItemGroup>
	);
}

export const BlockBindingsPanel = ( { name, metadata } ) => {
	const registry = useRegistry();
	const context = useContext( BlockContext );
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

	const { _id, registeredSources } = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( blockEditorStore );

		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			_id: selectedBlockClientId,
			registeredSources: unlock(
				select( blocksStore )
			).getAllBlockBindingsSources(),
		};
	}, [] );

	if ( bindableAttributes.length === 0 ) {
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
	Object.values( registeredSources ).forEach(
		( { getFieldsList, label } ) => {
			if ( getFieldsList ) {
				// TODO: Filter only the needed context defined in usesContext.
				fieldsList[ label ] = getFieldsList( {
					registry,
					context,
				} );
			}
		}
	);

	if ( Object.keys( fieldsList ).length === 0 ) {
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
				className="block-bindings-support-panel"
				hasInnerWrapper
				__experimentalFirstVisibleItemClass="first"
				__experimentalLastVisibleItemClass="last"
			>
				<div className="block-bindings-block-support-panel__inner-wrapper">
					{ bindableAttributes.map( ( attribute ) => (
						<ToolsPanelItem
							key={ attribute }
							hasValue={ () => !! filteredBindings[ attribute ] }
							label={ attribute }
							onDeselect={ () => {
								removeConnection( attribute );
							} }
						>
							<Dropdown
								popoverProps={ popoverProps }
								className="block-editor-block-bindings-filters-panel__dropdown"
								renderToggle={ ( { onToggle, isOpen } ) => {
									const toggleProps = {
										onClick: onToggle,
										className: clsx( {
											'is-open': isOpen,
										} ),
										'aria-expanded': isOpen,
									};
									return (
										<BlockBindingsAttribute
											toggleProps={ toggleProps }
											attribute={ attribute }
											filteredBindings={
												filteredBindings
											}
										/>
									);
								} }
								renderContent={ () => (
									<BlockBindingsPanelDropdown
										fieldsList={ fieldsList }
										addConnection={ addConnection }
										attribute={ attribute }
									/>
								) }
							/>
						</ToolsPanelItem>
					) ) }
					{ /* TODO: Add a helper to ToolPanel item */ }
					<p as="p" className="block-bindings-styled-help">
						{ __( 'Attributes connected to various sources.' ) }
					</p>
				</div>
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
