import type { RadioGroup as _RadioGroup } from '@base-ui/react/radio-group';
import type { ComponentProps } from '../../../utils/types';

export type RadioGroupProps = ComponentProps< typeof _RadioGroup > & {
	/** The radio items and their associated content. */
	children?: React.ReactNode;
};
