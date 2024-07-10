/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { CompositeGroup } from '@wordpress/components';

function InserterListboxRow( props, ref ) {
	return <CompositeGroup role="presentation" ref={ ref } { ...props } />;
}

export default forwardRef( InserterListboxRow );
