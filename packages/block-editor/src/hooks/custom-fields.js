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
export function addAttribute( settings ) {
	if ( hasBlockSupport( settings, 'connections', true ) ) {
		// Gracefully handle if settings.attributes is undefined.
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
 * Currently, only the `core/paragraph` block is supported and there is only a relation
 * between paragraph content and a custom field.
 *
 * @param {WPComponent} BlockEdit Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
export const withInspectorControl = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			const blockEditingMode = useBlockEditingMode();
			const hasCustomFieldsSupport = hasBlockSupport(
				props.name,
				'connections',
				false
			);

			// Check if the current block is a paragraph or image block.
			if ( ! [ 'core/paragraph', 'core/image' ].includes( props.name ) ) {
				return <BlockEdit { ...props } />;
			}

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
									<TextControl
										__nextHasNoMarginBottom
										autoComplete="off"
										label={ __( 'Custom field meta_key' ) }
										value={
											props.attributes?.connections
												?.attributes?.content?.value ||
											''
										}
										onChange={ ( nextValue ) => {
											if ( nextValue === '' ) {
												props.setAttributes( {
													connections: undefined,
													content: undefined,
													placeholder: undefined,
												} );
											} else {
												props.setAttributes( {
													connections: {
														attributes: {
															// Content will be variable, could be content, href, src, etc.
															content: {
																// Source will be variable, could be post_meta, user_meta, term_meta, etc.
																// Could even be a custom source like a social media attribute.
																source: 'meta_fields',
																value: nextValue,
															},
														},
													},
													content: undefined,
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
						) }
					</>
				);
			}

			return <BlockEdit { ...props } />;
		};
	},
	'withInspectorControl'
);
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
