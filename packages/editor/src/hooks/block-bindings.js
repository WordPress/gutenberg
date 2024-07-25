/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import {
	canBindAttribute,
	getBindableAttributes,
} from './use-bindings-attributes';
import { store as editorStore } from '../store';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
import { useSelect, useDispatch } from '@wordpress/data';
import { chevronRightSmall, customPostType } from '@wordpress/icons';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';
import {
	createHigherOrderComponent,
	useViewportMatch,
} from '@wordpress/compose';

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

function BlockBindingsPanelDropdown( { postMeta, addConnection, attribute } ) {
	return (
		<DropdownContentWrapper paddingSize="small">
			<MenuGroup label={ __( 'Custom Fields' ) }>
				{ Object.entries( postMeta )
					.filter( ( [ key ] ) => key !== 'footnotes' )
					.map( ( [ key, value ] ) => (
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

const BlockBindingsPanel = ( { name, attributes: { metadata } } ) => {
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

		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			_id: selectedBlockClientId,
		};
	}, [] );

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
	const postMeta = useSelect( ( select ) => {
		return select( editorStore ).getEditedPostAttribute( 'meta' );
	}, [] );
	if ( postMeta === undefined || bindableAttributes.length === 0 ) {
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
										postMeta={ postMeta }
										addConnection={ addConnection }
										attribute={ attribute }
									/>
								) }
							/>
						</ToolsPanelItem>
					) ) }
				</div>
			</ToolsPanel>
		</InspectorControls>
	);
};

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning a partial syncing controls to supported blocks in the pattern editor.
 * Currently, only the `core/paragraph` block is supported.
 *
 * @param {Component} BlockEdit Original component.
 *
 * @return {Component} Wrapped component.
 */
const withBlockBindings = createHigherOrderComponent(
	// Prevent this from running on every write block.
	( BlockEdit ) => ( props ) => {
		const bindableAttributes = getBindableAttributes( props?.name );
		return (
			<>
				<BlockEdit { ...props } />
				{ bindableAttributes.length > 0 && (
					<BlockBindingsPanel { ...props } />
				) }
			</>
		);
	},
	'withBlockBindings'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/with-block-bindings',
	withBlockBindings
);
