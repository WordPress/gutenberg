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
import {
	useBindingsUtils,
	useToolsPanelDropdownMenuProps,
} from '../bindings/utils';

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
import { createHigherOrderComponent } from '@wordpress/compose';

const popoverProps = {
	placement: 'left-start',
	offset: 36,
	shift: true,
	className: 'block-editor-block-bindings__popover',
	headerTitle: __( 'Custom Fields' ),
};

const BlockBindingsPanel = ( { name, attributes: { metadata } } ) => {
	const { bindings } = metadata || {};

	const bindableAttributes = getBindableAttributes( name );
	const { addConnection, removeConnection, removeAllConnections } =
		useBindingsUtils();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// Don't show not allowed attributes.
	// Don't show the bindings connected to pattern overrides in the inspectors panel.
	// TODO: Explore if this should be abstracted to let other sources decide.
	const filteredBindings = { ...bindings };
	Object.keys( filteredBindings ).forEach( ( key ) => {
		if (
			! canBindAttribute( name, key ) ||
			filteredBindings[ key ].source === 'core/pattern-overrides'
		) {
			delete filteredBindings[ key ];
		}
	} );
	const postMeta = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( editorStore ).getEditedPostAttribute( 'meta' );
	}, [] );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { _id } = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( blockEditorStore );

		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			_id: selectedBlockClientId,
		};
	}, [] );

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Attributes' ) }
				resetAll={ () => {
					removeAllConnections(
						metadata,
						_id,
						updateBlockAttributes
					);
				} }
				dropdownMenuProps={ dropdownMenuProps }
				className="components-panel__block-bindings-panel"
			>
				{ bindableAttributes.length > 0 && (
					<>
						{ bindableAttributes.map( ( attribute ) => (
							<ToolsPanelItem
								key={ attribute }
								hasValue={ () =>
									!! filteredBindings[ attribute ]
								}
								label={ attribute }
								onDeselect={ () => {
									removeConnection(
										attribute,
										metadata,
										_id,
										updateBlockAttributes
									);
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
											<ItemGroup isBordered isSeparated>
												<Button { ...toggleProps }>
													<Hstack
														align="center"
														justify="flex-start"
														expanded={ false }
													>
														<Icon
															icon={
																customPostType
															}
														/>
														<Truncate
															numberOfLines={ 1 }
															ellipsis="…"
														>
															{ attribute }
														</Truncate>
														{ !! filteredBindings[
															attribute
														] && (
															<>
																<Icon
																	icon={
																		chevronRightSmall
																	}
																/>
																<Truncate
																	numberOfLines={
																		1
																	}
																	ellipsis="…"
																>
																	{
																		filteredBindings[
																			attribute
																		]?.args
																			?.key
																	}
																</Truncate>
															</>
														) }
													</Hstack>
												</Button>
											</ItemGroup>
										);
									} }
									renderContent={ () => (
										<DropdownContentWrapper paddingSize="small">
											<MenuGroup
												label={ __( 'Custom Fields' ) }
											>
												{ Object.keys( postMeta ).map(
													( key ) => (
														<MenuItem
															className="components-panel__block-bindings-panel-item"
															key={ key }
															onClick={ () => {
																addConnection(
																	key,
																	attribute,
																	metadata,
																	_id,
																	updateBlockAttributes
																);
															} }
															icon={
																<Icon
																	icon={
																		customPostType
																	}
																/>
															}
															iconPosition="left"
															suffix={
																<Truncate
																	numberOfLines={
																		1
																	}
																	ellipsis="…"
																>
																	{
																		postMeta[
																			key
																		]
																	}
																</Truncate>
															}
														>
															<Truncate
																numberOfLines={
																	1
																}
																ellipsis="…"
															>
																{ key }
															</Truncate>
														</MenuItem>
													)
												) }
											</MenuGroup>
										</DropdownContentWrapper>
									) }
								/>
							</ToolsPanelItem>
						) ) }
					</>
				) }
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
