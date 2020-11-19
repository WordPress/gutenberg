/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

function InserterListboxGroup( props, ref ) {
	return <div role="listbox" { ...props } ref={ ref } />;
}

export default forwardRef( InserterListboxGroup );
