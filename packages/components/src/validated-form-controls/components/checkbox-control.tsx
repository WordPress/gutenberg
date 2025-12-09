/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import CheckboxControl from '../../checkbox-control';

const UnforwardedValidatedCheckboxControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof CheckboxControl >,
		'__nextHasNoMarginBottom'
	> &
		ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLDivElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			ref={ mergedRefs }
			customValidity={ customValidity }
			getValidityTarget={ () =>
				validityTargetRef.current?.querySelector< HTMLInputElement >(
					'input[type="checkbox"]'
				)
			}
		>
			<CheckboxControl
				__nextHasNoMarginBottom
				// TODO: Upstream limitation - CheckboxControl doesn't support uncontrolled mode, visually.
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedCheckboxControl = forwardRef(
	UnforwardedValidatedCheckboxControl
);
