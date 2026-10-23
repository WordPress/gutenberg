import { useRender } from '@base-ui/react';
import { Avatar as _Avatar } from '@base-ui/react/avatar';
import { forwardRef, useEffect, useState } from '@wordpress/element';

function FallbackElement( {
	elementProps,
	render,
	state,
	enabled,
}: {
	elementProps: React.ComponentPropsWithRef< 'span' >;
	render: _Avatar.Fallback.Props[ 'render' ];
	state: _Avatar.Fallback.State;
	enabled: boolean;
} ) {
	return useRender( {
		defaultTagName: 'span',
		// Forward the original state without adding useRender's automatic data attributes.
		render:
			typeof render === 'function'
				? ( props ) => render( props, state )
				: render,
		props: { ...elementProps },
		enabled,
	} );
}

/**
 * Work around Base UI delaying fallbacks for missing and failed images.
 * Remove this adapter and use _Avatar.Fallback directly once the installed
 * version bypasses delay for idle and error states.
 * https://github.com/mui/base-ui/issues/5988
 */
export const FallbackWithLoadingDelay = forwardRef<
	HTMLSpanElement,
	_Avatar.Fallback.Props
>( function AvatarFallbackWithLoadingDelay(
	{ delay = 0, render, ...props },
	ref
) {
	const [ delayPassed, setDelayPassed ] = useState( delay === 0 );

	useEffect( () => {
		if ( delay === 0 ) {
			setDelayPassed( true );
			return;
		}
		const timeout = setTimeout( () => setDelayPassed( true ), delay );
		return () => clearTimeout( timeout );
	}, [ delay ] );

	return (
		<_Avatar.Fallback
			{ ...props }
			ref={ ref }
			delay={ 0 }
			render={ ( elementProps, state ) => (
				<FallbackElement
					elementProps={ elementProps }
					render={ render }
					state={ state }
					enabled={
						state.imageLoadingStatus !== 'loading' || delayPassed
					}
				/>
			) }
		/>
	);
} );
