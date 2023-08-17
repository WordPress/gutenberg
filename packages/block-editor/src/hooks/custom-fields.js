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

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning a connection to blocks that has support for connections.
 * Currently, only the `core/paragraph` and `core/image` blocks are supported
 * and only the `content` and `url` attributes of these blocks are supported respectively.
 *
 * @param {WPComponent} BlockEdit Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
const withInspectorControl = createHigherOrderComponent( ( BlockEdit ) => {
	const blocksAttributesAllowlist = {
		'core/paragraph': [ 'content' ],
		'core/image': [ 'url', 'title' ],
	};

	return ( props ) => {
		const blockEditingMode = useBlockEditingMode();
		const hasCustomFieldsSupport = hasBlockSupport(
			props.name,
			'__experimentalConnections',
			false
		);

		// Check if the current block is a paragraph or image block.
		// Currently, only these two blocks are supported.
		if ( ! [ 'core/paragraph', 'core/image' ].includes( props.name ) ) {
			return <BlockEdit { ...props } />;
		}

		// If the block is a paragraph or image block, we need to know which
		// attribute to use for the connection. Only the `content` attribute
		// of the paragraph block and the `url` attribute of the image block are supported.
		const attributeNames = blocksAttributesAllowlist[ props.name ];

		if ( hasCustomFieldsSupport && props.isSelected ) {
			return (
				<>
					<BlockEdit { ...props } />
					{ blockEditingMode === 'default' && (
						<InspectorControls>
							<PanelBody
								title={ __( 'Connections' ) }
								initialOpen={ true }
							>
								{ attributeNames.map( ( attributeName ) => (
									<TextControl
										key={ attributeName }
										__nextHasNoMarginBottom
										autoComplete="off"
										placeholder={ attributeName }
										label={ __( `Custom field meta_key` ) }
										value={
											props.attributes?.connections
												?.attributes?.[ attributeName ]
												?.value || ''
										}
										onChange={ ( nextValue ) => {
											if ( nextValue === '' ) {
												props.setAttributes( {
													connections: {
														attributes: {
															...props.attributes
																?.connections
																?.attributes,
															[ attributeName ]:
																undefined,
														},
													},
													[ attributeName ]: '',
													placeholder: undefined,
												} );
											} else {
												props.setAttributes( {
													connections: {
														attributes: {
															...props.attributes
																?.connections
																?.attributes,
															[ attributeName ]: {
																// Source will be variable in the future, could be post_meta, user_meta, term_meta, etc.
																// Could even be a custom source like a social media attribute.
																source: 'meta_fields',
																value: nextValue,
															},
														},
													},
													[ attributeName ]: '',
													placeholder: sprintf(
														'This content will be replaced on the frontend by the value of "%s" custom field.',
														nextValue
													),
												} );
											}
										} }
									/>
								) ) }
							</PanelBody>
						</InspectorControls>
					) }
				</>
			);
		}

		return <BlockEdit { ...props } />;
	};
}, 'withInspectorControl' );

if ( window.__experimentalConnections ) {
	addFilter(
		'blocks.registerBlockType',
		'core/connections/attribute',
		addAttribute
	);
	addFilter(
		'editor.BlockEdit',
		'core/connections/with-inspector-control',
		withInspectorControl
	);
}
