import type { ControlWithErrorProps } from '../primitives/control-with-error/types';

export type ValidatedControlProps = Pick<
	ControlWithErrorProps,
	'required' | 'markWhenOptional' | 'customValidity'
>;
