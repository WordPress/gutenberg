import { forwardRef, useId, useRef } from '@wordpress/element';
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import { ToggleGroupControl } from '../../toggle-group-control';

/**
 * The option currently holding the roving tabindex. Focus on the hidden
 * delegate is redirected here.
 */
const ACTIVE_ITEM_SELECTOR = '[data-active-item="true"]';

/**
 * The group container. A group-level description is what a screen reader
 * announces on entering the group, so the validity message goes here rather
 * than on an individual option — and unlike the active item, this element is
 * always present.
 *
 * `ToggleGroupControl` renders a `radiogroup` by default and a `group` in its
 * deselectable mode.
 */
const GROUP_SELECTOR = '[role="radiogroup"],[role="group"]';

const UnforwardedValidatedToggleGroupControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: React.ComponentProps< typeof ToggleGroupControl > &
		ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );

	const nameAttr = useId();

	const getInteractiveTarget = () =>
		validityTargetRef.current?.previousElementSibling?.querySelector(
			GROUP_SELECTOR
		);

	return (
		<div className="components-validated-control__wrapper-with-error-delegate">
			<ControlWithError
				required={ required }
				markWhenOptional={ markWhenOptional }
				customValidity={ customValidity }
				getValidityTarget={ () => validityTargetRef.current }
				getInteractiveTarget={ getInteractiveTarget }
			>
				<ToggleGroupControl ref={ forwardedRef } { ...restProps } />
			</ControlWithError>
			<input
				className="components-validated-control__error-delegate"
				type="radio"
				ref={ validityTargetRef }
				required={ required }
				checked={ restProps.value !== undefined }
				tabIndex={ -1 }
				// A name attribute is needed for the `required` behavior to work.
				name={ nameAttr }
				onChange={ () => {} }
				onFocus={ ( e ) => {
					e.target.previousElementSibling
						?.querySelector< HTMLButtonElement | HTMLInputElement >(
							ACTIVE_ITEM_SELECTOR
						)
						?.focus();
				} }
			/>
		</div>
	);
};

export const ValidatedToggleGroupControl = forwardRef(
	UnforwardedValidatedToggleGroupControl
);
ValidatedToggleGroupControl.displayName = 'ValidatedToggleGroupControl';
