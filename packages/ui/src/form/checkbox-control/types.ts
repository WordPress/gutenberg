import type { Checkbox } from '../primitives';
import type { ControlProps } from '../types';

export type CheckboxControlProps = Omit<
	React.ComponentProps< typeof Checkbox >,
	'hasExpandedHitArea'
> &
	ControlProps;
