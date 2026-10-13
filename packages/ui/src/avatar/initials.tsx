import { forwardRef } from '@wordpress/element';
import { Fallback } from './fallback';
import type { InitialsProps } from './types';

/**
 * Shows up to two initials while the image is unavailable.
 * Uses the first complete character of the first two whitespace-separated words.
 * Blank names display the standard person fallback. For another name convention,
 * supply your own initials through `Avatar.Fallback`.
 * Compose as an alternative to `Avatar.Fallback`, not inside it.
 */
export const Initials = forwardRef< HTMLSpanElement, InitialsProps >(
	function AvatarInitials( { name, locale, ...props }, ref ) {
		const segmenter = new Intl.Segmenter( locale, {
			granularity: 'grapheme',
		} );
		const initials = name
			?.trim()
			.split( /\s+/ )
			.slice( 0, 2 )
			.map(
				( word ) =>
					segmenter.segment( word ).containing( 0 )?.segment ?? ''
			)
			.join( '' )
			.toLocaleUpperCase( locale );

		return (
			<Fallback { ...props } ref={ ref }>
				{ initials || undefined }
			</Fallback>
		);
	}
);
