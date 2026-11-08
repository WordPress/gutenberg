import type { ComponentProps, ReactNode } from 'react';
import type { __experimentalUnitControl as UnitControl } from '@wordpress/components';

type UnitControlProps = ComponentProps< typeof UnitControl >;

/**
 * Props of `TextIndentControl`. The units come from the block settings.
 */
export interface TextIndentControlProps extends Omit<
	UnitControlProps,
	'value' | 'onChange' | 'label' | 'units'
> {
	/**
	 * Currently selected text indent.
	 */
	value?: string;
	/**
	 * Handles change in text indent selection.
	 */
	onChange?: ( value?: string ) => void;
	/**
	 * Input width to pass through to inner UnitControl. Should be a valid CSS
	 * value.
	 */
	__unstableInputWidth?: UnitControlProps[ '__unstableInputWidth' ];
	/**
	 * Whether to show the slider control.
	 */
	withSlider?: boolean;
	/**
	 * Whether to add bottom margin below the control.
	 */
	hasBottomMargin?: boolean;
	/**
	 * Help text to display below the control.
	 */
	help?: ReactNode;
	/**
	 * Class name to add to the inner UnitControl.
	 */
	className?: string;
	/**
	 * Placeholder for the inner UnitControl.
	 */
	placeholder?: string;
}
