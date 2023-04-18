/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';

/**
 * Filters registered block settings, extending attributes to include `className`.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	if ( hasBlockSupport( settings, 'customClassName', true ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			className: {
				type: 'string',
			},
		};
	}

	return settings;
}

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning the custom class name, if block supports custom class name.
 * The control is displayed within the Advanced panel in the block inspector.
 *
 * @param {WPComponent} BlockEdit Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
export const withInspectorControl = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			const hasCustomClassName = hasBlockSupport(
				props.name,
				'customClassName',
				true
			);
			if ( hasCustomClassName && props.isSelected ) {
				return (
					<>
						<BlockEdit { ...props } />
						<InspectorControls group="advanced">
							<TextControl
								__nextHasNoMarginBottom
								autoComplete="off"
								label={ __( 'Additional CSS class(es)' ) }
								value={ props.attributes.className || '' }
								onChange={ ( nextValue ) => {
									props.setAttributes( {
										className:
											nextValue !== ''
												? nextValue
												: undefined,
									} );
								} }
								help={ __(
									'Separate multiple classes with spaces.'
								) }
							/>
						</InspectorControls>
					</>
				);
			}

			return <BlockEdit { ...props } />;
		};
	},
	'withInspectorControl'
);

/**
 * Override props assigned to save component to inject the className, if block
 * supports customClassName. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if (
		hasBlockSupport( blockType, 'customClassName', true ) &&
		attributes.className
	) {
		extraProps.className = classnames(
			extraProps.className,
			attributes.className
		);
	}

	return extraProps;
}

export function addTransforms( result, source, index, results ) {
	if ( ! hasBlockSupport( result.name, 'customClassName', true ) ) {
		return result;
	}

	// If the condition verifies we are probably in the presence of a wrapping transform
	// e.g: nesting paragraphs in a group or columns and in that case the class should not be kept.
	if ( results.length === 1 && result.innerBlocks.length === source.length ) {
		return result;
	}

	// If we are transforming one block to multiple blocks or multiple blocks to one block,
	// we ignore the class during the transform.
	if (
		( results.length === 1 && source.length > 1 ) ||
		( results.length > 1 && source.length === 1 )
	) {
		return result;
	}

	// If we are in presence of transform between one or more block in the source
	// that have one or more blocks in the result
	// we apply the class on source N to the result N,
	// if source N does not exists we do nothing.
	if ( source[ index ] ) {
		const originClassName = source[ index ]?.attributes.className;
		if ( originClassName ) {
			return {
				...result,
				attributes: {
					...result.attributes,
					className: originClassName,
				},
			};
		}
	}
	return result;
}

addFilter(
	'blocks.registerBlockType',
	'core/custom-class-name/attribute',
	addAttribute
);
addFilter(
	'editor.BlockEdit',
	'core/editor/custom-class-name/with-inspector-control',
	withInspectorControl
);
addFilter(
	'blocks.getSaveContent.extraProps',
	'core/custom-class-name/save-props',
	addSaveProps
);

addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/color/addTransforms',
	addTransforms
);
