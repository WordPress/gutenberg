/**
 * External dependencies
 */
import { size, MiddlewareArguments } from '@floating-ui/react-dom';

export function overlayMiddlewares() {
	return [
		{
			name: 'overlay',
			fn( { rects }: MiddlewareArguments ) {
				return rects.reference;
			},
		},
		size( {
			apply( { rects, elements } ) {
				const { firstElementChild } = elements.floating ?? {};

				// Only HTMLElement instances have the `style` property.
				if ( ! ( firstElementChild instanceof HTMLElement ) ) return;

				// Reduce the height of the popover to the available space.
				Object.assign( firstElementChild.style, {
					width: `${ rects.reference.width }px`,
					height: `${ rects.reference.height }px`,
				} );
			},
		} ),
	];
}
