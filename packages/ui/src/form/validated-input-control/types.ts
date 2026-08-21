import type { InputControlProps } from '../input-control/types';
import type { ControlWithErrorProps } from '../primitives/control-with-error/types';

export type ValidatedInputControlProps = InputControlProps &
	Pick<
		ControlWithErrorProps,
		'required' | 'markWhenOptional' | 'customValidity'
	>;
