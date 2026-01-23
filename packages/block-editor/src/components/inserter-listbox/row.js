/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { Composite } from '@wordpress/components';

function InserterListboxRow( props, ref ) {
	return <Composite.Group role="presentation" ref={ ref } { ...props } />;
}

export default forwardRef( InserterListboxRow );
