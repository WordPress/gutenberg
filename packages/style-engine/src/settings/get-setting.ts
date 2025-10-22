/**
 * Internal dependencies
 */
import { getValueFromObjectPath, setImmutably } from '../utils/object';
import type { GlobalStylesConfig } from '../types';

const VALID_SETTINGS = [
	'appearanceTools',
	'useRootPaddingAwareAlignments',
	'background.backgroundImage',
	'background.backgroundRepeat',
	'background.backgroundSize',
	'background.backgroundPosition',
	'border.color',
	'border.radius',
	'border.radiusSizes',
	'border.style',
	'border.width',
	'shadow.presets',
	'shadow.defaultPresets',
	'color.background',
	'color.button',
	'color.caption',
	'color.custom',
	'color.customDuotone',
	'color.customGradient',
	'color.defaultDuotone',
	'color.defaultGradients',
	'color.defaultPalette',
	'color.duotone',
	'color.gradients',
	'color.heading',
	'color.link',
	'color.palette',
	'color.text',
	'custom',
	'dimensions.aspectRatio',
	'dimensions.minHeight',
	'layout.contentSize',
	'layout.definitions',
	'layout.wideSize',
	'lightbox.enabled',
	'lightbox.allowEditing',
	'position.fixed',
	'position.sticky',
	'spacing.customSpacingSize',
	'spacing.defaultSpacingSizes',
	'spacing.spacingSizes',
	'spacing.spacingScale',
	'spacing.blockGap',
	'spacing.margin',
	'spacing.padding',
	'spacing.units',
	'typography.fluid',
	'typography.customFontSize',
	'typography.defaultFontSizes',
	'typography.dropCap',
	'typography.fontFamilies',
	'typography.fontSizes',
	'typography.fontStyle',
	'typography.fontWeight',
	'typography.letterSpacing',
	'typography.lineHeight',
	'typography.textAlign',
	'typography.textColumns',
	'typography.textDecoration',
	'typography.textTransform',
	'typography.writingMode',
];

export function getSetting< T = any >(
	globalStyles: GlobalStylesConfig,
	path: string,
	blockName?: string
): T {
	const appendedBlockPath = blockName ? '.blocks.' + blockName : '';
	const appendedPropertyPath = path ? '.' + path : '';
	const contextualPath = `settings${ appendedBlockPath }${ appendedPropertyPath }`;
	const globalPath = `settings${ appendedPropertyPath }`;

	if ( path ) {
		return ( getValueFromObjectPath( globalStyles, contextualPath ) ??
			getValueFromObjectPath( globalStyles, globalPath ) ) as T;
	}

	let result = {};
	VALID_SETTINGS.forEach( ( setting ) => {
		const value =
			getValueFromObjectPath(
				globalStyles,
				`settings${ appendedBlockPath }.${ setting }`
			) ??
			getValueFromObjectPath( globalStyles, `settings.${ setting }` );
		if ( value !== undefined ) {
			result = setImmutably( result, setting.split( '.' ), value );
		}
	} );
	return result as T;
}
