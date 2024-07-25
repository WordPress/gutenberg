/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import {
	BaseControl,
	PanelBody,
	__experimentalHStack as HStack,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	Modal,
	FormTokenField,
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { plus } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { canBindAttribute } from '../hooks/use-bindings-attributes';
import { unlock } from '../lock-unlock';
import InspectorControls from '../components/inspector-controls';
import { store as blockEditorStore } from '../store';

export const BlockBindingsPanel = ( { name, metadata } ) => {
	const { bindings } = metadata || {};
	const { sources } = useSelect( ( select ) => {
		const _sources = unlock(
			select( blocksStore )
		).getAllBlockBindingsSources();

		return {
			sources: _sources,
		};
	}, [] );

	const [ connectionModal, setConnectionModal ] = useState( false );
	const [ metaValues, setMetaValues ] = useState( [] );

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
	const data = useSelect( ( select ) => {
		// Access the core/editor store
		const { getEditedPostAttribute } = select( 'core/editor' );

		// Fetch the meta data for the current post
		const metaData = getEditedPostAttribute( 'meta' );
		// Return the meta data if you need to use it in your component
		return metaData;
	}, [] );

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	// Inside your component
	const fetchMetas = ( value ) => {
		// If array contains "core/post-meta" and is array with at least one value.
		if ( value === 'core/post-meta' ) {
			setMetaValues( Object.keys( data ) );
		}
	};

	const { _id } = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( blockEditorStore );

		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			_id: selectedBlockClientId,
		};
	}, [] );

	const onCloseNewConnection = ( value ) => {
		// Alert the selected value
		setConnectionModal( false );
		setMetaValues( [] );

		// Use useDispatch to get the updateBlockAttributes function

		// Assuming the block expects a flat structure for its metadata attribute
		const newMetadata = {
			metadata: {
				// Adjust this according to the actual structure expected by your block
				bindings: {
					content: {
						source: 'core/post-meta',
						args: { key: value },
					},
				},
			},
		};

		// Update the block's attributes with the new metadata
		updateBlockAttributes( _id, {
			...newMetadata,
		} );
	};

	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Attributes' ) }
				className="components-panel__block-bindings-panel"
			>
				<BaseControl
					help={ __( 'Attributes connected to various sources.' ) }
				>
					<ItemGroup isBordered isSeparated size="large">
						<MenuItem
							iconPosition="right"
							icon={ plus }
							className="block-editor-link-control__search-item"
							onClick={ () => setConnectionModal( true ) }
						>
							{ __( 'Add new connection' ) }
						</MenuItem>
						{ connectionModal && (
							<Modal
								title={ __( 'Select your source' ) }
								onRequestClose={ () =>
									setConnectionModal( false )
								}
								className="components-modal__block-bindings-modal"
							>
								<MenuGroup>
									<MenuItemsChoice
										choices={ Object.keys( sources ).map(
											( key ) => {
												return {
													label: key,
													value: key,
												};
											}
										) }
										onSelect={ ( key ) => {
											fetchMetas( key );
										} }
									/>
								</MenuGroup>
							</Modal>
						) }
						{ metaValues && metaValues.length > 0 && (
							<Modal title={ __( 'Add custom field' ) }>
								<MenuGroup>
									<MenuItemsChoice
										choices={ metaValues.map( ( key ) => {
											return {
												label: key,
												value: key,
											};
										} ) }
										onSelect={ ( key ) => {
											onCloseNewConnection( key );
										} }
									/>
								</MenuGroup>
							</Modal>
						) }
						{ Object.keys( filteredBindings ).map( ( key ) => {
							return (
								<Item key={ key }>
									<HStack>
										<span>{ key }</span>
										<span className="components-item__block-bindings-source">
											{ sources[
												filteredBindings[ key ].source
											]
												? sources[
														filteredBindings[ key ]
															.source
												  ].label
												: filteredBindings[ key ]
														.source }
										</span>
									</HStack>
								</Item>
							);
						} ) }
					</ItemGroup>
				</BaseControl>
			</PanelBody>
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
