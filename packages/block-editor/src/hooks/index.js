/**
 * Internal dependencies
 */
import {
	createBlockEditFilter,
	createBlockListBlockFilter,
	createBlockSaveFilter,
} from './utils';
import './compat';
import align from './align';
import background from './background';
import './lock';
import anchor from './anchor';
import ariaLabel from './aria-label';
import customClassName from './custom-class-name';
import './generated-class-name';
import style from './style';
import './settings';
import color from './color';
import dimensions from './dimensions';
import duotone from './duotone';
import fontFamily from './font-family';
import fontSize from './font-size';
import textAlign from './text-align';
import border from './border';
import position from './position';
import blockStyleVariation from './block-style-variation';
import layout from './layout';
import childLayout from './layout-child';
import contentLockUI from './content-lock-ui';
import './metadata';
import blockHooks from './block-hooks';
import blockBindingsPanel from './block-bindings';
import './block-renaming';
import './use-bindings-attributes';
import './grid-visualizer';

createBlockEditFilter(
	[
		align,
		textAlign,
		anchor,
		customClassName,
		style,
		duotone,
		position,
		layout,
		contentLockUI,
		blockHooks,
		blockBindingsPanel,
		childLayout,
	].filter( Boolean )
);
createBlockListBlockFilter( [
	align,
	textAlign,
	background,
	style,
	color,
	dimensions,
	duotone,
	fontFamily,
	fontSize,
	border,
	position,
	blockStyleVariation,
	childLayout,
] );
createBlockSaveFilter( [
	align,
	textAlign,
	anchor,
	ariaLabel,
	customClassName,
	border,
	color,
	style,
	fontFamily,
	fontSize,
] );

export { useCustomSides } from './dimensions';
export { useLayoutClasses, useLayoutStyles } from './layout';
export { getBorderClassesAndStyles, useBorderProps } from './use-border-props';
export { getShadowClassesAndStyles } from './use-shadow-props';
export { getColorClassesAndStyles, useColorProps } from './use-color-props';
export { getSpacingClassesAndStyles } from './use-spacing-props';
export { getTypographyClassesAndStyles } from './use-typography-props';
export { getGapCSSValue } from './gap';
export { useCachedTruthy } from './use-cached-truthy';
export { setBackgroundStyleDefaults } from './background';
export { useZoomOut } from './use-zoom-out';
export { __unstableBlockStyleVariationOverridesWithConfig } from './block-style-variation';
export { useStyleOverride } from './utils';
