import type { ComponentProps } from 'react';
import type { DuotonePicker } from '@wordpress/components';

type DuotonePickerProps = ComponentProps< typeof DuotonePicker >;

export interface DuotoneControlProps extends Pick<
	DuotonePickerProps,
	| 'colorPalette'
	| 'duotonePalette'
	| 'disableCustomColors'
	| 'disableCustomDuotone'
	| 'value'
	| 'selectedSlug'
	| 'onChange'
> {
	/** ID of the control, generated when omitted. */
	id?: string;
}
