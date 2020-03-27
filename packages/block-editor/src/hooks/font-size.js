/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	getFontSize,
	getFontSizeClass,
	getFontSizeObjectByValue,
	FontSizePicker,
} from '../components/font-sizes';
import InspectorControls from '../components/inspector-controls';

const FONT_SIZE_SUPPORT_KEY = '__experimentalFontSize';

/**
 * Filters registered block settings, extending attributes to include
 * `fontSize` and `fontWeight` attributes.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addAttributes( settings ) {
	if ( ! hasBlockSupport( settings, FONT_SIZE_SUPPORT_KEY ) ) {
		return settings;
	}

	// Allow blocks to specify a default value if needed.
	if ( ! settings.attributes.fontSize ) {
		Object.assign( settings.attributes, {
			fontSize: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject font size.
 *
 * @param  {Object} props      Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Block attributes
 * @return {Object}            Filtered props applied to save element
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, FONT_SIZE_SUPPORT_KEY ) ) {
		return props;
	}

	const { fontSize } = attributes;

	const fontSizeClass = getFontSizeClass( fontSize );

	props.className = classnames( props.className, fontSizeClass );

	return props;
}

/**
 * Filters registered block settings to expand the block edit wrapper
 * by applying the desired styles and classnames.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addEditProps( settings ) {
	if ( ! hasBlockSupport( settings, FONT_SIZE_SUPPORT_KEY ) ) {
		return settings;
	}

	const existingGetEditWrapperProps = settings.getEditWrapperProps;
	settings.getEditWrapperProps = ( attributes ) => {
		let props = {};
		if ( existingGetEditWrapperProps ) {
			props = existingGetEditWrapperProps( attributes );
		}
		return addSaveProps( props, settings, attributes );
	};

	return settings;
}

const FontSizeInspectorControl = ( { value, onChange } ) => (
	<InspectorControls key="inspector-controls">
		<PanelBody title={ __( 'Text settings' ) }>
			<FontSizePicker value={ value } onChange={ onChange } />
		</PanelBody>
	</InspectorControls>
);

const setFontSize = ( { style, setAttributes }, fontSizes ) => ( value ) => {
	const fontSizeSlug = getFontSizeObjectByValue( fontSizes, value ).slug;

	setAttributes( {
		style: {
			...style,
			typography: {
				...style?.typography,
				fontSize: fontSizeSlug ? undefined : value,
			},
		},
		fontSize: fontSizeSlug,
	} );
};

const hasFontSizeSupport = ( { name: blockName } ) =>
	hasBlockSupport( blockName, FONT_SIZE_SUPPORT_KEY );

/**
 * Override the default edit UI to include inspector controls
 * for font size, if block defines support.
 *
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
const withBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { fontSizes } = useSelect( ( select ) =>
			select( 'core/block-editor' ).getSettings()
		);

		const fontSize = getFontSize(
			fontSizes,
			props.fontSize,
			props.style?.fontSize
		);

		if ( ! hasFontSizeSupport( props ) ) {
			return <BlockEdit key="edit" { ...props } fontSize={ fontSize } />;
		}

		return [
			<FontSizeInspectorControl
				key="inspector-controls"
				value={ fontSize.size }
				onChange={ setFontSize( props, fontSizes ) }
			/>,
			<BlockEdit key="edit" { ...props } fontSize={ fontSize } />,
		];
	},
	'withFontSizeControlsTest'
);

addFilter(
	'blocks.registerBlockType',
	'core/font/addAttribute',
	addAttributes
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/font/addSaveProps',
	addSaveProps
);

addFilter( 'blocks.registerBlockType', 'core/font/addEditProps', addEditProps );

addFilter(
	'editor.BlockEdit',
	'core/font/with-block-controls',
	withBlockControls
);
