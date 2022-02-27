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
		setSeprecatedOpacityWithNoColor,
	] = useState( false );
	const previousColor = usePrevious( currentColor );

	useEffect( () => {
		if ( opacity === 'css' && ! currentColor && ! previousColor ) {
			setSeprecatedOpacityWithNoColor( true );
		}
	}, [ currentColor, previousColor, opacity ] );

	useEffect( () => {
		if (
			opacity === 'css' &&
			( ( deprecatedOpacityWithNoColor && currentColor ) ||
				( previousColor && currentColor !== previousColor ) )
		) {
			setAttributes( { opacity: 'alpha-channel' } );
			setSeprecatedOpacityWithNoColor( false );
		}
	}, [ deprecatedOpacityWithNoColor, currentColor, previousColor ] );
}
