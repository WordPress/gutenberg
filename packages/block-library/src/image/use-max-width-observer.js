/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';

function useMaxWidthObserver() {
	const [ contentResizeListener, { width } ] = useResizeObserver();
	const observerRef = useRef();

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
			ref={ observerRef }
		>
			{ contentResizeListener }
		</div>
	);

	return [ maxWidthObserver, width ];
}

export { useMaxWidthObserver };
