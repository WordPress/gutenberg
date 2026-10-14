import type { RadioGroup as _RadioGroup } from '@base-ui/react/radio-group';
import type { ComponentProps } from '../../../utils/types';

export type RadioGroupProps< Value = unknown > = ComponentProps<
	typeof _RadioGroup< Value >
> & {
	/** The radio items and their associated content. */
	children?: React.ReactNode;
};
