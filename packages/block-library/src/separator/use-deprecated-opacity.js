/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

export default function useDeprecatedOpacity(
	opacity,
	currentColor,
	setAttributes
) {
	const [
		deprecatedOpacityWithNoColor,
		setDeprecatedOpacityWithNoColor,
	] = useState( false );
	const previousColor = usePrevious( currentColor );

	// A separator with no color set will always have previousColor set to undefined,
	// and we need to differentiate these from those with color set that will return
	// previousColor as undefined on the first render.
	useEffect( () => {
		if ( opacity === 'css' && ! currentColor && ! previousColor ) {
			setDeprecatedOpacityWithNoColor( true );
		}
	}, [ currentColor, previousColor, opacity ] );

	useEffect( () => {
		if (
			opacity === 'css' &&
			( ( deprecatedOpacityWithNoColor && currentColor ) ||
				( previousColor && currentColor !== previousColor ) )
		) {
			setAttributes( { opacity: 'alpha-channel' } );
			setDeprecatedOpacityWithNoColor( false );
		}
	}, [ deprecatedOpacityWithNoColor, currentColor, previousColor ] );
}
