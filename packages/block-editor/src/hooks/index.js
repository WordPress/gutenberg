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
import './lock';
import anchor from './anchor';
import ariaLabel from './aria-label';
import customClassName from './custom-class-name';
import './generated-class-name';
import style from './style';
import './settings';
import color from './color';
import duotone from './duotone';
import fontFamily from './font-family';
import fontSize from './font-size';
import border from './border';
import position from './position';
import layout from './layout';
import childLayout from './layout-child';
import contentLockUI from './content-lock-ui';
import './metadata';
import customFields from './custom-fields';
import blockHooks from './block-hooks';
import blockRenaming from './block-renaming';

createBlockEditFilter(
	[
		align,
		anchor,
		customClassName,
		style,
		duotone,
		position,
		layout,
		contentLockUI,
		window.__experimentalConnections ? customFields : null,
		blockHooks,
		blockRenaming,
	].filter( Boolean )
);
createBlockListBlockFilter( [
	align,
	style,
	color,
	duotone,
	fontFamily,
	fontSize,
	border,
	position,
	childLayout,
] );
createBlockSaveFilter( [
	align,
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
export { getColorClassesAndStyles, useColorProps } from './use-color-props';
export { getSpacingClassesAndStyles } from './use-spacing-props';
export { getTypographyClassesAndStyles } from './use-typography-props';
export { getGapCSSValue } from './gap';
export { useCachedTruthy } from './use-cached-truthy';
