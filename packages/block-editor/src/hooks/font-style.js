/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { Button, ButtonGroup, Icon } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import {
	formatBold,
	formatItalic,
	formatStrikethrough,
} from '@wordpress/icons';
import TokenList from '@wordpress/token-list';

/**
 * Internal dependencies
 */
import useEditorFeature from '../components/use-editor-feature';
import { cleanEmptyObject } from './utils';

export const FONT_STYLE_SUPPORT_KEY = '__experimentalFontStyle';

/**
 * Collection of CSS classes to apply the various font styling options.
 *
 * Rather than use a simple `has-<something>-font-style` format, this option
 * was chosen so that the CSS classes were more explicit in what they would be
 * setting.
 */
export const fontStyleClasses = {
	bold: 'has-bold-font-weight',
	italic: 'has-italic-font-style',
	underline: 'has-underline-text-decoration',
	strikethrough: 'has-strikethrough-text-decoration',
};

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

	if ( attributes.style?.typography?.fontStyles ) {
		const styles = attributes.style.typography.fontStyles;

		// Use TokenList to de-dupe classes.
		const classes = new TokenList( props.className );
		classes.add( `has-font-style` );

		for ( const style in styles ) {
			if ( styles[ style ] ) {
				classes.add( fontStyleClasses[ style ] );
			}
		}

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

	const allowedFontStyles = useEditorFeature( 'typography.fontStyles' );
	const isDisabled = useIsFontStyleDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	// Need to force the size related styles to be applied to dashicon.
	const underlineIcon = () => (
		<Icon
			icon="editor-underline"
			size={ 24 }
			style={ { width: '24px', height: '24px', fontSize: '24px' } }
		/>
	);

	const fontStyles = style?.typography?.fontStyles || {};
	const { bold, italic, underline, strikethrough } = fontStyles;

	const updateFontStyles = ( toggledStyles ) => {
		const newStyle = {
			...style,
			typography: {
				...style?.typography,
				fontStyles: {
					...fontStyles,
					...toggledStyles,
				},
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};

	return (
		<>
			<p>{ __( 'Font Styles' ) }</p>
			<ButtonGroup>
				{ allowedFontStyles.bold && (
					<Button
						icon={ formatBold }
						label="Bold"
						isPressed={ bold }
						onClick={ () => updateFontStyles( { bold: ! bold } ) }
					/>
				) }
				{ allowedFontStyles.italic && (
					<Button
						icon={ formatItalic }
						label="Italic"
						isPressed={ italic }
						onClick={ () =>
							updateFontStyles( { italic: ! italic } )
						}
					/>
				) }
				{ allowedFontStyles.underline && (
					<Button
						icon={ underlineIcon }
						label="Underline"
						isPressed={ underline }
						onClick={ () =>
							updateFontStyles( {
								underline: ! underline,
								strikethrough: ! underline
									? false
									: strikethrough,
							} )
						}
					/>
				) }
				{ allowedFontStyles.strikethrough && (
					<Button
						icon={ formatStrikethrough }
						label="Strikethrough"
						isPressed={ strikethrough }
						onClick={ () =>
							updateFontStyles( {
								strikethrough: ! strikethrough,
								underline: ! strikethrough ? false : underline,
							} )
						}
					/>
				) }
			</ButtonGroup>
		</>
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
	const hasFontStyles =
		Object.values( fontStyles ).filter( ( style ) => style ).length >= 1;

	return (
		! hasBlockSupport( blockName, FONT_STYLE_SUPPORT_KEY ) ||
		! hasFontStyles
	);
}

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
