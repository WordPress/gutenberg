/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

function InserterListboxGroup( props, ref ) {
	return (
		<div
			role="listbox"
			aria-orientation="horizontal"
			{ ...props }
			ref={ ref }
		/>
	);
}

export default forwardRef( InserterListboxGroup );
