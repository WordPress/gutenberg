import { Avatar as _Avatar } from '@base-ui/react/avatar';
import { useEffect, useState } from '@wordpress/element';

/**
 * Work around Base UI delaying fallbacks for missing and failed images.
 * Remove this adapter and use _Avatar.Fallback directly once the installed
 * version bypasses delay for idle and error states.
 * https://github.com/mui/base-ui/issues/5988
 */
export function FallbackWithLoadingDelay( {
	children,
	className,
}: {
	children: string;
	className: string;
} ) {
	const [ delayPassed, setDelayPassed ] = useState( false );

	useEffect( () => {
		const timeout = setTimeout( () => setDelayPassed( true ), 300 );
		return () => clearTimeout( timeout );
	}, [] );

	return (
		<_Avatar.Fallback
			className={ className }
			render={ ( props, { imageLoadingStatus } ) =>
				imageLoadingStatus === 'loading' && ! delayPassed ? (
					<></>
				) : (
					<span { ...props } />
				)
			}
		>
			{ children }
		</_Avatar.Fallback>
	);
}
