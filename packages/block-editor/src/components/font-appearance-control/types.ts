import type { ComponentProps } from 'react';
import type { Select } from '@wordpress/ui';
import type { FontFamilyFace } from '../../utils/types';

/**
 * A font style and weight.
 */
export interface FontAppearanceValue {
	fontStyle?: string;
	fontWeight?: string;
}

/**
 * Props of `FontAppearanceControl`. The props forwarded to the select's
 * trigger, such as event handlers, are accepted too.
 */
export interface FontAppearanceControlProps extends Omit<
	ComponentProps< typeof Select.Trigger >,
	'onChange' | 'value'
> {
	/**
	 * Start opting into the larger default height that will become the
	 * default size in a future version.
	 *
	 * @deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * Called with the selected font style and weight.
	 */
	onChange: ( value: FontAppearanceValue ) => void;
	/**
	 * Whether font styles are enabled and present.
	 */
	hasFontStyles?: boolean;
	/**
	 * Whether font weights are enabled and present.
	 */
	hasFontWeights?: boolean;
	/**
	 * The font faces of the active font family.
	 */
	fontFamilyFaces?: FontFamilyFace[];
	/**
	 * The current font style and weight.
	 */
	value: FontAppearanceValue;
	hideLabelFromVision?: boolean;
	disabled?: boolean;
	/*
	 * Props of the previous implementation, accepted and ignored so they
	 * don't reach the trigger.
	 */
	className?: string;
	label?: string;
	describedBy?: string;
	options?: unknown;
	showSelectedHint?: boolean;
	__experimentalShowSelectedHint?: boolean;
	__nextUnconstrainedWidth?: boolean;
	__nextHasNoMarginBottom?: boolean;
}
