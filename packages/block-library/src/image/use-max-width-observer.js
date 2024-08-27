/**
 * WordPress dependencies
 */
import { useRef, useMemo } from '@wordpress/element';
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

	const maxWidth = useMemo( () => {
		const observer = observerRef.current;
		if ( ! observer ) {
			return width;
		}

		const win = observer.ownerDocument.defaultView;
		const observerStyle = win.getComputedStyle( observer );
		const parentStyle = win.getComputedStyle( observer.parentElement );

		const isParentBorderBox = parentStyle.boxSizing === 'border-box';
		const paddingInline = isParentBorderBox
			? 0
			: parseFloat( parentStyle.paddingLeft ) +
			  parseFloat( parentStyle.paddingRight );

		const observerMaxWidth = parseFloat( observerStyle.maxWidth );
		const contentWidth =
			width - ( Number.isNaN( paddingInline ) ? 0 : paddingInline );

		return Number.isNaN( observerMaxWidth )
			? contentWidth
			: Math.min( contentWidth, observerMaxWidth );
	}, [ width ] );

	return [ maxWidthObserver, maxWidth ];
}

export { useMaxWidthObserver };
