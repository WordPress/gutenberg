/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

function TreeGridCell( props, ref ) {
	return <td role="gridcell" ref={ ref } { ...props } />;
}

export default forwardRef( TreeGridCell );
