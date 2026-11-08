import type { Switch } from '../primitives';
import type { ControlProps } from '../types';

export type SwitchControlProps = React.ComponentProps< typeof Switch > &
	ControlProps;
