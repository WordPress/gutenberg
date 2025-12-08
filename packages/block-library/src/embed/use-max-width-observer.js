/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';

function useMaxWidthObserver() {
	const observerRef = useRef();
	const [ width, setWidth ] = useState();

	const setObserverRef = useResizeObserver( ( [ entry ] ) => {
		setWidth( entry.contentRect.width );
	} );

	const maxWidthObserver = (
		<div
			// Some themes set max-width on blocks.
			className="wp-block"
			aria-hidden="true"
			style={ {
				position: 'absolute',
				inset: 0,
				width: '100%',
				height: 0,
				margin: 0,
			} }
			ref={ ( node ) => {
				observerRef.current = node;
				setObserverRef( node );
			} }
		/>
	);

	return [ maxWidthObserver, width ];
}

export { useMaxWidthObserver };
