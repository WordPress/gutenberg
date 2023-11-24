/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { PanelBody, TextControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';
import { useBlockEditingMode } from '../components/block-editing-mode';

/**
 * Filters registered block settings, extending attributes to include `connections`.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttribute( settings ) {
	if ( hasBlockSupport( settings, '__experimentalConnections', true ) ) {
		// Gracefully handle if settings.attributes.connections is undefined.
		settings.attributes = {
			...settings.attributes,
			connections: {
				type: 'object',
			},
		};
	}

	return settings;
}

function CustomFieldsControl( props ) {
	const blockEditingMode = useBlockEditingMode();
	if ( blockEditingMode !== 'default' ) {
		return null;
	}

	// If the block is a paragraph or image block, we need to know which
	// attribute to use for the connection. Only the `content` attribute
	// of the paragraph block and the `url` attribute of the image block are supported.
	let attributeName;
	if ( props.name === 'core/paragraph' ) attributeName = 'content';
	if ( props.name === 'core/image' ) attributeName = 'url';

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Connections' ) } initialOpen={ true }>
				<TextControl
					__nextHasNoMarginBottom
					autoComplete="off"
					label={ __( 'Custom field meta_key' ) }
					value={
						props.attributes?.connections?.attributes?.[
							attributeName
						]?.value || ''
					}
					onChange={ ( nextValue ) => {
						if ( nextValue === '' ) {
							props.setAttributes( {
								connections: undefined,
								[ attributeName ]: undefined,
								placeholder: undefined,
							} );
						} else {
							props.setAttributes( {
								connections: {
									attributes: {
										// The attributeName will be either `content` or `url`.
										[ attributeName ]: {
											// Source will be variable, could be post_meta, user_meta, term_meta, etc.
											// Could even be a custom source like a social media attribute.
											source: 'meta_fields',
											value: nextValue,
										},
									},
								},
								[ attributeName ]: undefined,
								placeholder: sprintf(
									'This content will be replaced on the frontend by the value of "%s" custom field.',
									nextValue
								),
							} );
						}
					} }
				/>
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning a connection to blocks that has support for connections.
 * Currently, only the `core/paragraph` block is supported and there is only a relation
 * between paragraph content and a custom field.
 *
 * @param {Component} BlockEdit Original component.
 *
 * @return {Component} Wrapped component.
 */
const withCustomFieldsControls = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const hasCustomFieldsSupport = hasBlockSupport(
			props.name,
			'__experimentalConnections',
			false
		);

		// Check if the current block is a paragraph or image block.
		// Currently, only these two blocks are supported.
		if ( ! [ 'core/paragraph', 'core/image' ].includes( props.name ) ) {
			return <BlockEdit key="edit" { ...props } />;
		}

		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{ hasCustomFieldsSupport && props.isSelected && (
					<CustomFieldsControl { ...props } />
				) }
			</>
		);
	};
}, 'withCustomFieldsControls' );

if ( window.__experimentalConnections ) {
	addFilter(
		'blocks.registerBlockType',
		'core/editor/connections/attribute',
		addAttribute
	);
	addFilter(
		'editor.BlockEdit',
		'core/editor/connections/with-inspector-controls',
		withCustomFieldsControls
	);
}
