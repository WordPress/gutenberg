import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { ControlWithError } from '../../index';

const ValidatedInput = forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes< HTMLInputElement > & { label?: string }
>( function ValidatedInput( { label, ...restProps }, ref ) {
	return <input ref={ ref } aria-label={ label } { ...restProps } />;
} );

type ValidatedInputControlProps = React.ComponentProps<
	typeof ValidatedInput
> &
	Pick<
		React.ComponentProps< typeof ControlWithError >,
		'required' | 'markWhenOptional' | 'customValidity'
	>;

export const ValidatedInputControl = forwardRef<
	HTMLInputElement,
	ValidatedInputControlProps
>( function ValidatedInputControl(
	{ required, markWhenOptional, customValidity, ...restProps },
	forwardedRef
) {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<ValidatedInput ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
} );
