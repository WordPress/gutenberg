import { type ComponentProps } from '../utils/types';

export interface TextProps extends ComponentProps< 'span' > {
	/**
	 * The typographic variant to apply, controlling font family, size,
	 * line height, and weight.
	 *
	 * @default "body-md"
	 */
	variant?:
		| 'heading-2xl'
		| 'heading-xl'
		| 'heading-lg'
		| 'heading-md'
		| 'heading-sm'
		| 'body-xl'
		| 'body-lg'
		| 'body-md'
		| 'body-sm';

	/**
	 * The content to be rendered inside the component.
	 */
	children?: React.ReactNode;
}
