/**
 * External dependencies
 */
import { useRadioState, RadioGroup as AriakitRadioGroup } from 'ariakit/radio';

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
		defaultValue: defaultChecked,
		value: checked,
		setValue: onChange,
	} );
	const radioContext = { ...radioState, disabled };

	return (
		<RadioContext.Provider value={ radioContext }>
			<AriakitRadioGroup
				ref={ ref }
				as={ ButtonGroup }
				aria-label={ label }
				state={ radioState }
				{ ...props }
			/>
		</RadioContext.Provider>
	);
}

export default forwardRef( RadioGroup );
