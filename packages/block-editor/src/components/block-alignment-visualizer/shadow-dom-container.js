/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { createPortal, useState } from '@wordpress/element';

export default function ShadowDOMContainer( { children } ) {
	const [ shadowRoot, setShadowRoot ] = useState( null );
	const ref = useRefEffect( ( node ) => {
		setShadowRoot( node.attachShadow( { mode: 'open' } ) );
		return () => setShadowRoot( null );
	}, [] );

	return (
		<div ref={ ref }>
			{ shadowRoot && createPortal( children, shadowRoot ) }
		</div>
	);
}
