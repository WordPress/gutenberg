/**
 * External dependencies
 */
import { Radio as AriakitRadio } from 'ariakit/radio';

/**
 * WordPress dependencies
 */
import { useContext, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import RadioContext from '../radio-context';

function Radio( { children, value, ...props }, ref ) {
	const radioContext = useContext( RadioContext );
	const checked = radioContext.value === value;

	return (
		<AriakitRadio
			ref={ ref }
			as={ Button }
			variant={ checked ? 'primary' : 'secondary' }
			value={ value }
			disabled={ radioContext.disabled }
			{ ...props }
		>
			{ children || value }
		</AriakitRadio>
	);
}

export default forwardRef( Radio );
