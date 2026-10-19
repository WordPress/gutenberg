import type { ComponentProps } from 'react';
import type { __experimentalUnitControl as UnitControl } from '@wordpress/components';

type UnitControlProps = ComponentProps< typeof UnitControl >;

/**
 * Props of `LetterSpacingControl`.
 */
export interface LetterSpacingControlProps extends Omit<
	UnitControlProps,
	'value' | 'onChange' | 'label'
> {
	/**
	 * Start opting into the larger default height that will become the
	 * default size in a future version.
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * Currently selected letter-spacing.
	 */
	value?: string;
	/**
	 * Handles change in letter-spacing selection.
	 */
	onChange: ( value?: string ) => void;
	/**
	 * Input width to pass through to inner UnitControl. Should be a valid CSS
	 * value.
	 */
	__unstableInputWidth?: UnitControlProps[ '__unstableInputWidth' ];
}
