import type { Textarea } from '../primitives';
import type { ControlProps } from '../types';

export type TextareaControlProps = React.ComponentProps< typeof Textarea > &
	ControlProps;
