/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import {
	BaseControl,
	PanelBody,
	MenuGroup,
	MenuItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { plus, reset } from '@wordpress/icons';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	canBindAttribute,
	getBindableAttributes,
} from './use-bindings-attributes';
import { unlock } from '../lock-unlock';
import { store as blockEditorStore } from '../store';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	DropdownMenuItemHelpTextV2: DropDownMenuItemHelpText,
} = unlock( componentsPrivateApis );

const BlockBindingsPanel = ( { name, metadata } ) => {
	const { bindings } = metadata || {};
	const { sources } = useSelect( ( select ) => {
		const _sources = unlock(
			select( blocksStore )
		).getAllBlockBindingsSources();
		return {
			sources: _sources,
		};
	}, [] );

	const bindableAttributes = getBindableAttributes( name );

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
		return select( 'core/editor' ).getEditedPostAttribute( 'meta' );
	}, [] );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { _id } = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( blockEditorStore );

		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			_id: selectedBlockClientId,
		};
	}, [] );

	const onCloseNewConnection = ( value, attribute ) => {
		// Assuming the block expects a flat structure for its metadata attribute
		const newMetadata = {
			...metadata,
			// Adjust this according to the actual structure expected by your block
			bindings: {
				...bindings,
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

	const allAttributesBinded =
		Object.keys( filteredBindings ).length === bindableAttributes?.length;

	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Attributes' ) }
				className="components-panel__block-bindings-panel"
			>
				<BaseControl
					help={ __( 'Attributes connected to various sources.' ) }
				>
					<MenuGroup isBordered isSeparated size="large">
						{ bindableAttributes.length > 0 &&
							! allAttributesBinded && (
								<DropdownMenu
									trigger={
										<MenuItem
											iconPosition="right"
											icon={ plus }
											className="block-editor-link-control__search-item"
										>
											{ __( 'Add new connection' ) }
										</MenuItem>
									}
									placement="left"
									gutter={ 20 }
								>
									{ bindableAttributes.map( ( attribute ) => (
										<DropdownMenu
											key={ attribute }
											trigger={
												<DropdownMenuItem>
													<DropdownMenuItemLabel>
														{ attribute }
													</DropdownMenuItemLabel>
												</DropdownMenuItem>
											}
											placement="left"
											gutter={ 10 }
										>
											{ Object.keys( postMeta )
												.filter(
													( value ) =>
														value !== 'footnotes'
												)
												.map( ( key ) => (
													<DropdownMenuItem
														key={ key }
														onClick={ () => {
															onCloseNewConnection(
																key,
																attribute
															);
														} }
													>
														<DropdownMenuItemLabel>
															{ postMeta[ key ] }
														</DropdownMenuItemLabel>
														<DropDownMenuItemHelpText>
															{ key }
														</DropDownMenuItemHelpText>
													</DropdownMenuItem>
												) ) }
										</DropdownMenu>
									) ) }
								</DropdownMenu>
							) }
						<MenuGroup>
							{ Object.keys( filteredBindings ).map( ( key ) => {
								const source = sources[
									filteredBindings[ key ].source
								]
									? sources[ filteredBindings[ key ].source ]
											.label
									: filteredBindings[ key ].source;
								return (
									<MenuItem
										key={ key }
										onClick={ () =>
											removeConnection( key )
										}
										icon={ reset }
									>
										{ key } - { source }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					</MenuGroup>
				</BaseControl>
			</PanelBody>
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
