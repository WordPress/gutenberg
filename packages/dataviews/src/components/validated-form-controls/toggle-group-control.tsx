import { forwardRef, useId, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { __experimentalToggleGroupControl as ToggleGroupControl } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	ControlWithError,
} from '@wordpress/ui';
import type { ValidatedControlProps } from './types';

type ToggleGroupControlProps = React.ComponentProps<
	typeof ToggleGroupControl
>;

type ValidatedToggleGroupControlProps = ToggleGroupControlProps &
	ValidatedControlProps;

const UnforwardedValidatedToggleGroupControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: ValidatedToggleGroupControlProps,
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	// The error describes the group, like its `help` text, because the item
	// that receives focus changes with the selection.
	const groupRef = useRef< HTMLDivElement >( null );
	const mergedRef = useMergeRefs( [ groupRef, forwardedRef ] );

	const nameAttr = useId();

	return (
		<div className="dataviews-validated-control__wrapper-with-error-delegate">
			<ControlWithError
				className="dataviews-validated-control"
				required={ required }
				markWhenOptional={ markWhenOptional }
				customValidity={ customValidity }
				getValidityTarget={ () => validityTargetRef.current }
				getInteractiveTarget={ () => groupRef.current }
			>
				<ToggleGroupControl ref={ mergedRef } { ...restProps } />
			</ControlWithError>
			<input
				className="dataviews-validated-control__error-delegate"
				type="radio"
				ref={ validityTargetRef }
				required={ required }
				checked={ restProps.value !== undefined }
				tabIndex={ -1 }
				aria-hidden="true"
				// A name attribute is needed for the `required` behavior to work.
				name={ nameAttr }
				onChange={ () => {} }
				onFocus={ ( e ) => {
					e.target.previousElementSibling
						?.querySelector< HTMLButtonElement | HTMLInputElement >(
							'[data-active-item="true"]'
						)
						?.focus();
				} }
			/>
		</div>
	);
};

export const ValidatedToggleGroupControl: React.ForwardRefExoticComponent<
	React.PropsWithoutRef< ValidatedToggleGroupControlProps > &
		React.RefAttributes< HTMLDivElement >
> = forwardRef( UnforwardedValidatedToggleGroupControl );
ValidatedToggleGroupControl.displayName = 'ValidatedToggleGroupControl';
