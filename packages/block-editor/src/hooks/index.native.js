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
import anchor from './anchor';
import customClassName from './custom-class-name';
import './generated-class-name';
import style from './style';
import color from './color';
import fontSize from './font-size';
import './layout';

createBlockEditFilter( [ align, anchor, style ] );
createBlockListBlockFilter( [ align, style, color, fontSize ] );
createBlockSaveFilter( [
	align,
	anchor,
	customClassName,
	color,
	style,
	fontSize,
] );

export { getBorderClassesAndStyles, useBorderProps } from './use-border-props';
export { getShadowClassesAndStyles } from './use-shadow-props';
export { getColorClassesAndStyles, useColorProps } from './use-color-props';
export { getSpacingClassesAndStyles } from './use-spacing-props';
export { useCachedTruthy } from './use-cached-truthy';
export { useEditorWrapperStyles } from './use-editor-wrapper-styles';
export { getTypographyClassesAndStyles } from './use-typography-props';
