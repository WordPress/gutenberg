/**
 * Internal dependencies
 */
import { createBlockEditFilter } from './utils';
import './compat';
import align from './align';
import './lock';
import anchor from './anchor';
import './aria-label';
import customClassName from './custom-class-name';
import './generated-class-name';
import style from './style';
import './settings';
import './color';
import duotone from './duotone';
import './font-family';
import './font-size';
import './border';
import position from './position';
import layout from './layout';
import './content-lock-ui';
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
		window.__experimentalConnections ? customFields : null,
		blockHooks,
		blockRenaming,
	].filter( Boolean )
);

export { useCustomSides } from './dimensions';
export { useLayoutClasses, useLayoutStyles } from './layout';
export { getBorderClassesAndStyles, useBorderProps } from './use-border-props';
export { getColorClassesAndStyles, useColorProps } from './use-color-props';
export { getSpacingClassesAndStyles } from './use-spacing-props';
export { getTypographyClassesAndStyles } from './use-typography-props';
export { getGapCSSValue } from './gap';
export { useCachedTruthy } from './use-cached-truthy';
