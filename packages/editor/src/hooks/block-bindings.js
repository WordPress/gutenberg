/**
 * Internal dependencies
 */
import {
	canBindAttribute,
	getBindableAttributes,
} from './use-bindings-attributes';
import { unlock } from '../lock-unlock';
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
	privateApis as componentsPrivateApis,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalHStack as Hstack,
	__experimentalTruncate as Truncate,
	__experimentalText as Text,
	Icon,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	chevronRightSmall,
	customPostType,
	plus,
	reset,
} from '@wordpress/icons';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

const { DropdownMenuV2: DropdownMenu } = unlock( componentsPrivateApis );

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
				label={ __( 'Connections' ) }
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
								{ !! filteredBindings[ attribute ] ? (
									<MenuItem
										onClick={ () =>
											removeConnection(
												attribute,
												metadata,
												_id,
												updateBlockAttributes
											)
										}
										suffix={ <Icon icon={ reset } /> }
										className="components-panel__block-bindings-panel-item"
									>
										<Hstack
											align="center"
											expanded={ false }
										>
											<Text as="span">{ attribute }</Text>
											<Icon icon={ chevronRightSmall } />
											<Text
												as="span"
												className="components-panel__block-bindings-panel-item-source"
											>
												{
													filteredBindings[
														attribute
													].source
												}
											</Text>
										</Hstack>
									</MenuItem>
								) : (
									<DropdownMenu
										trigger={
											<Hstack align="center">
												<Text as="span">
													{ attribute }
												</Text>
												<Icon icon={ plus } />
											</Hstack>
										}
										placement="left"
										gutter={ 20 }
									>
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
																size={ 24 }
															/>
														}
														iconPosition="left"
														suffix={
															<Truncate>
																{
																	postMeta[
																		key
																	]
																}
															</Truncate>
														}
													>
														{ key }
													</MenuItem>
												)
											) }
										</MenuGroup>
									</DropdownMenu>
								) }
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
