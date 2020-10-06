/**
 * WordPress dependencies
 */
import TokenList from '@wordpress/token-list';
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useEditorFeature from '../components/use-editor-feature';
import { cleanEmptyObject } from './utils';

export const FONT_STYLE_SUPPORT_KEY = '__experimentalFontStyle';

/**
 * Filters registered block settings, extending attributes to include
 * `fontStyle`.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addAttribute( settings ) {
	if ( ! hasBlockSupport( settings, FONT_STYLE_SUPPORT_KEY ) ) {
		return settings;
	}

	// Allow blocks to specify a default value if needed.
	if ( ! settings.attributes?.fontStyle ) {
		// Handle edge case where attributes is undefined as well.
		settings.attributes = {
			...settings.attributes,
			fontStyle: { type: 'string' },
		};
	}

	return settings;
}

/**
 * Override props assigned to save component to inject font style.
 *
 * @param  {Object} props      Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Block attributes
 * @return {Object}            Filtered props applied to save element
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, FONT_STYLE_SUPPORT_KEY ) ) {
		return props;
	}

	if ( attributes.fontStyle ) {
		// Use TokenList to de-dupe classes.
		const classes = new TokenList( props.className );
		classes.add( `has-font-style` );
		classes.add( `has-${ attributes.fontStyle }-font-style` );
		const newClassName = classes.value;
		props.className = newClassName ? newClassName : undefined;
	}

	return props;
}

/**
 * Filters registered block settings to expand the block edit wrapper
 * by applying the desired classname.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addEditProps( settings ) {
	if ( ! hasBlockSupport( settings, FONT_STYLE_SUPPORT_KEY ) ) {
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

/**
 * Inspector control panel containing the font style option for italics.
 *
 * @param {Object} props
 * @return {WPElement} Font style edit element.
 */
export function FontStyleEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const isDisabled = useIsFontStyleDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	const onChange = ( fontStyle ) => {
		const newStyle = {
			...style,
			typography: {
				...style?.typography,
				fontStyle: fontStyle ? fontStyle : undefined,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
			fontStyle,
		} );
	};

	const styleOptions = [
		{
			label: __( 'Normal' ),
			value: '',
		},
		{
			label: __( 'Italics' ),
			value: 'italic',
		},
	];

	return (
		<SelectControl
			options={ styleOptions }
			value={ style?.typography?.fontStyle }
			label={ __( 'Font Style' ) }
			onChange={ onChange }
		/>
	);
}

/**
 * Hook to check if font-style settings have been disabled.
 *
 * @param {string} name Name of the block.
 * @return {boolean} Whether or not the setting is disabled.
 */
export function useIsFontStyleDisabled( { name: blockName } = {} ) {
	const fontStyles = useEditorFeature( 'typography.fontStyles' );
	const hasFontStyles = fontStyles.length;

	return (
		! hasBlockSupport( blockName, FONT_STYLE_SUPPORT_KEY ) ||
		! hasFontStyles
	);
}

addFilter(
	'blocks.registerBlockType',
	'core/font-style/addAttribute',
	addAttribute
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/font-style/addSaveProps',
	addSaveProps
);

addFilter(
	'blocks.registerBlockType',
	'core/font-style/addEditProps',
	addEditProps
);
