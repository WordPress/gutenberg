import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useSearch } from '@wordpress/route';

export const DEFAULT_DEVICE_TYPE = 'Desktop';

// Lowercase in the URL, PascalCase in the editor store.
const VALID_VIEWPORTS = [ 'desktop', 'tablet', 'mobile' ];

const capitalize = ( value: string ) =>
	value.charAt( 0 ).toUpperCase() + value.slice( 1 );

/**
 * Keeps the editor's device preview in step with the `viewport` search param.
 *
 * Set when navigating into an entity that asks to be edited at a particular
 * width — a navigation overlay meant for mobile — and read back on the way out,
 * where the entity being returned to carries the width it was left at.
 *
 * Runs on every change rather than only on mount, because returning to an entity
 * changes the param without remounting the canvas.
 */
export default function useViewportSync() {
	const { viewport } = useSearch( { strict: false } ) as {
		viewport?: string;
	};
	const { setDeviceType } = useDispatch( editorStore );

	useEffect( () => {
		const requested = viewport?.toLowerCase();

		setDeviceType(
			requested && VALID_VIEWPORTS.includes( requested )
				? capitalize( requested )
				: DEFAULT_DEVICE_TYPE
		);
	}, [ viewport, setDeviceType ] );
}
