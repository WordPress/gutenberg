/**
 * External dependencies
 */
import classnames from 'classnames';
import { has } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { BlockControls } from '../components';
import GridPositionToolbar from '../components/grid-position-toolbar';

/**
 * Filters registered block settings, extending attributes to include `align`.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
export function addAttribute( settings ) {
	// allow blocks to specify their own attribute definition with default values if needed.
	if ( has( settings.attributes, [ 'position', 'type' ] ) ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'position', true ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			position: {
				type: 'string',
			},
		};
	}

	return settings;
}

/**
 * Override the default edit UI to include new toolbar controls for block
 * alignment, if block defines support.
 *
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
export const withToolbarControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name: blockName } = props;
		const supportsPosition = hasBlockSupport( blockName, 'position', true );
		if ( ! supportsPosition ) {
			return <BlockEdit { ...props } />;
		}

		const updatePosition = ( position ) => {
			props.setAttributes( { position } );
		};

		return [
			<BlockControls key="position-controls">
				<GridPositionToolbar
					value={ props.attributes.position }
					onChange={ updatePosition }
				/>
			</BlockControls>,
			<BlockEdit key="edit" { ...props } />,
		];
	},
	'withToolbarControls'
);

/**
 * Override the default block element to add alignment wrapper props.
 *
 * @param  {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
export const withPositionClassname = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { name, attributes } = props;
		const { position } = attributes;
		const supportsPosition = hasBlockSupport( name, 'position', true );

		if ( ! supportsPosition || position === undefined ) {
			return <BlockListBlock { ...props } />;
		}

		const wrapperProps = {
			...props.wrapperProps,
			className: classnames(
				props?.wrapperProps?.className,
				`wp-layout-grid__${ position }`
			),
		};

		return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
	}
);

/**
 * Override props assigned to save component to inject alignment class name if
 * block supports it.
 *
 * @param  {Object} props      Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Block attributes
 * @return {Object}            Filtered props applied to save element
 */
export function addSaveClassname( props, blockType, attributes ) {
	const { position } = attributes;
	const supportsPosition = hasBlockSupport( blockType, 'position', true );

	if ( supportsPosition && !! position ) {
		props.className = classnames(
			`wp-layout-grid__${ position }`,
			props.className
		);
	}

	return props;
}

addFilter(
	'blocks.registerBlockType',
	'core/position/addAttribute',
	addAttribute
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/position/with-position-classname',
	withPositionClassname
);
addFilter(
	'editor.BlockEdit',
	'core/editor/position/with-toolbar-controls',
	withToolbarControls
);
addFilter(
	'blocks.getSaveContent.extraProps',
	'core/position/addSaveClassname',
	addSaveClassname
);
