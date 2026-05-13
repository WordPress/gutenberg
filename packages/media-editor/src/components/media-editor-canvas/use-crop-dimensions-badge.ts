/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

// Linger time on the dimensions badge after a gesture ends. Long enough
// to let the eye land on the final value, short enough that the chrome
// isn't sitting on the image during idle review.
const LINGER_MS = 500;

export interface UseCropDimensionsBadgeReturn {
	visible: boolean;
	onGestureStart: () => void;
	onGestureEnd: () => void;
}

/**
 * Encapsulates the dimensions-badge visibility lifecycle: shown while
 * any cropper gesture is active, lingers briefly after release so the
 * eye can land on the final value. The canvas composes these handlers
 * with its own `commitHistory` + consumer callbacks.
 */
export function useCropDimensionsBadge(): UseCropDimensionsBadgeReturn {
	const [ visible, setVisible ] = useState( false );
	const lingerTimerRef = useRef< ReturnType< typeof setTimeout > >();

	useEffect( () => {
		return () => {
			clearTimeout( lingerTimerRef.current );
		};
	}, [] );

	const onGestureStart = useCallback( () => {
		clearTimeout( lingerTimerRef.current );
		setVisible( true );
	}, [] );

	const onGestureEnd = useCallback( () => {
		clearTimeout( lingerTimerRef.current );
		lingerTimerRef.current = setTimeout( () => {
			setVisible( false );
		}, LINGER_MS );
	}, [] );

	return { visible, onGestureStart, onGestureEnd };
}
