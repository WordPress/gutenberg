import type { ForwardedRef } from 'react';
import deprecated from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import FormToggle from '.';
import type { FormToggleProps } from './types';

function UnforwardedDeprecatedFormToggle(
	props: WordPressComponentProps< FormToggleProps, 'input', false >,
	ref: ForwardedRef< HTMLInputElement >
) {
	deprecated( 'wp.components.FormToggle', {
		since: '7.3',
		version: '7.5',
		alternative: 'Switch from @wordpress/ui',
	} );

	return <FormToggle { ...props } ref={ ref } />;
}

/**
 * FormToggle switches a single setting on or off.
 *
 * @deprecated Use `Switch` from `@wordpress/ui` instead.
 *
 * ```jsx
 * import { FormToggle } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyFormToggle = () => {
 *   const [ isChecked, setChecked ] = useState( true );
 *
 *   return (
 *     <FormToggle
 *       checked={ isChecked }
 *       onChange={ () => setChecked( ( state ) => ! state ) }
 *     />
 *   );
 * };
 * ```
 */
const DeprecatedFormToggle = forwardRef( UnforwardedDeprecatedFormToggle );
DeprecatedFormToggle.displayName = 'FormToggle';

export default DeprecatedFormToggle;
