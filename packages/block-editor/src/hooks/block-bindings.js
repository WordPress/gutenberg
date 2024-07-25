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
	__experimentalTruncate as Truncate,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	Dropdown,
	Icon,
} from '@wordpress/components';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { customPostType } from '@wordpress/icons';
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
		<DropdownContentWrapper
			paddingSize="small"
			className="block-editor-block-bindings__popover_inner-wrapper"
		>
			{ Object.entries( fieldsList ).map( ( [ label, fields ] ) => (
				<MenuGroup key={ label } label={ label }>
					{ Object.entries( fields ).map( ( [ key, value ] ) => (
						<MenuItem
							key={ key }
							onClick={ () => addConnection( key, attribute ) }
							icon={ <Icon icon={ customPostType } /> }
							iconPosition="left"
							suffix={
								<Truncate className="block-editor-block-bindings-panel-item-source">
									{ value }
								</Truncate>
							}
						>
							<Truncate>{ key }</Truncate>
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
		<MenuItem { ...toggleProps }>
			<Truncate className="block-editor-block-bindings-panel-item__attribute">
				{ attribute }
			</Truncate>
			{ !! filteredBindings[ attribute ] && (
				<Truncate className="block-editor-block-bindings-panel-item__source">
					{ filteredBindings[ attribute ].args.key }
				</Truncate>
			) }
		</MenuItem>
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
	Object.values( registeredSources ).forEach(
		( { getFieldsList, label } ) => {
			if ( getFieldsList ) {
				// TODO: Filter only the needed context defined in usesContext.
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
				className="block-editor-block-bindings-support-panel"
				hasInnerWrapper
				__experimentalFirstVisibleItemClass="first"
				__experimentalLastVisibleItemClass="last"
			>
				<div className="block-editor-block-bindings-block-support-panel__inner-wrapper">
					{ bindableAttributes.map( ( attribute ) => (
						<ToolsPanelItem
							key={ attribute }
							hasValue={ () => !! filteredBindings[ attribute ] }
							label={ attribute }
							onDeselect={ () => {
								removeConnection( attribute );
							} }
							className="block-editor-block-bindings-panel-item"
						>
							<Dropdown
								popoverProps={ popoverProps }
								className="block-editor-block-bindings-filters-panel__dropdown"
								renderToggle={ ( { onToggle, isOpen } ) => {
									const toggleProps = {
										onClick: onToggle,
										className: clsx(
											'block-editor-block-bindings-attributes',
											{
												'is-open': isOpen,
											}
										),
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
					<p className="block-editor-block-bindings-styled-help">
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
