import type { ComponentProps } from '../../../utils/types';

/**
 * HTML elements that support the Constraint Validation API.
 *
 * Here, we exclude HTMLButtonElement because although it does technically support the API,
 * normal buttons are actually exempted from any validation.
 * @see https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement/willValidate
 */
export type ValidityTarget =
	| HTMLFieldSetElement
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement;

export type ControlWithErrorProps = Omit<
	ComponentProps< 'div' >,
	'children'
> & {
	/**
	 * Whether the control is required.
	 *
	 * @default false
	 */
	required?: boolean;
	/**
	 * Label the control as "optional" when _not_ `required`, instead of the inverse.
	 *
	 * @default false
	 */
	markWhenOptional?: boolean;
	/**
	 * Show a custom message based on the validation status.
	 *
	 * - When `type` is `invalid`, the message will be applied to the underlying element using the
	 * native [`setCustomValidity()` method](https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity).
	 * This means the custom message will be prioritized over any existing validity messages
	 * triggered by HTML attribute-based validation.
	 * - When `type` is `validating` or `valid`, the custom validity message of the underlying element
	 * will be cleared. If there are no remaining validity messages triggered by HTML attribute-based validation,
	 * the message will be presented as a status indicator rather than an error. These indicators are intended
	 * for asynchronous validation calls that may take more than 1 second to complete.
	 * Otherwise, custom errors can simply be cleared by setting the `customValidity` prop to `undefined`.
	 */
	customValidity?: {
		type: 'validating' | 'valid' | 'invalid';
		message: string;
	};
	/**
	 * A function that returns the actual element on which the validity data should be applied.
	 */
	getValidityTarget: () => ValidityTarget | null | undefined;
	/**
	 * The control component to apply validation to.
	 *
	 * As `children` will be cloned with additional props,
	 * the component at the root of `children` should accept
	 * `label`, `onChange`, and `required` props, and process them
	 * appropriately.
	 */
	children: React.ReactElement< {
		label?: React.ReactNode;
		required?: boolean;
	} >;
};
