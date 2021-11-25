/**
 * External dependencies
 */
import { useRadioState, RadioGroup as ReakitRadioGroup } from 'reakit/Radio';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ButtonGroup from '../button-group';
import RadioContext from '../radio-context';

function RadioGroup(
	{ label, checked, defaultChecked, disabled, onChange, ...props },
	ref
) {
	const radioState = useRadioState( {
		state: defaultChecked,
		baseId: props.id,
	} );
	const radioContext = {
		...radioState,
		disabled,
		// Controlled or uncontrolled.
		state: checked ?? radioState.state,
		setState: onChange ?? radioState.setState,
	};

	return (
		<RadioContext.Provider value={ radioContext }>
			<ReakitRadioGroup
				ref={ ref }
				as={ ButtonGroup }
				aria-label={ label }
				{ ...radioState }
				{ ...props }
			/>
		</RadioContext.Provider>
	);
}

export default forwardRef( RadioGroup );
