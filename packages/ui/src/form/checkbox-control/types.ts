import type { Checkbox } from '../primitives';
import type { ControlProps } from '../types';

export type CheckboxControlProps = React.ComponentProps< typeof Checkbox > &
	ControlProps;
