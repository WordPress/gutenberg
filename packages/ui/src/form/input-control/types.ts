import type { Input } from '../primitives';
import type { ControlProps } from '../types';

export type InputControlProps = React.ComponentProps< typeof Input > &
	ControlProps;
