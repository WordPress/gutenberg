/**
 * WordPress dependencies
 */
import { __unstableMotion as motion } from '@wordpress/components';
import {
	useThrottle,
	useReducedMotion,
	useResizeObserver,
} from '@wordpress/compose';
import { useLayoutEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useStyle } from './hooks';

const normalizedWidth = 248;
const normalizedHeight = 152;

// Throttle options for useThrottle. Must be defined outside of the component,
// so that the object reference is the same on each render.
const THROTTLE_OPTIONS = {
	leading: true,
	trailing: true,
};

interface PreviewWrapperProps {
	children:
		| ( ( args: { ratio: number; key: number } ) => React.ReactNode )
		| ( ( args: { ratio: number; key: number } ) => React.ReactNode )[];
	label?: string;
	isFocused?: boolean;
	withHoverView?: boolean;
}

function PreviewWrapper( {
	children,
	label,
	isFocused,
	withHoverView,
}: PreviewWrapperProps ) {
	const [ backgroundColor = 'white' ] =
		useStyle< string >( 'color.background' );
	const [ gradientValue ] = useStyle< string >( 'color.gradient' );
	const disableMotion = useReducedMotion();
	const [ isHovered, setIsHovered ] = useState( false );
	const [ containerResizeListener, { width } ] = useResizeObserver();
	const [ throttledWidth, setThrottledWidthState ] = useState( width );
	const [ ratioState, setRatioState ] = useState< number | undefined >();

	const setThrottledWidth = useThrottle(
		setThrottledWidthState,
		250,
		THROTTLE_OPTIONS
	);

	// Must use useLayoutEffect to avoid a flash of the container  at the wrong
	// size before the width is set.
	useLayoutEffect( () => {
		if ( width ) {
			setThrottledWidth( width );
		}
	}, [ width, setThrottledWidth ] );

	// Must use useLayoutEffect to avoid a flash of the container at the wrong
	// size before the width is set.
	useLayoutEffect( () => {
		const newRatio = throttledWidth ? throttledWidth / normalizedWidth : 1;
		const ratioDiff = newRatio - ( ratioState || 0 );

		// Only update the ratio state if the difference is big enough
		// or if the ratio state is not yet set. This is to avoid an
		// endless loop of updates at particular viewport heights when the
		// presence of a scrollbar causes the width to change slightly.
		const isRatioDiffBigEnough = Math.abs( ratioDiff ) > 0.1;

		if ( isRatioDiffBigEnough || ! ratioState ) {
			setRatioState( newRatio );
		}
	}, [ throttledWidth, ratioState ] );

	// Set a fallbackRatio to use before the throttled ratio has been set.
	const fallbackRatio = width ? width / normalizedWidth : 1;
	/*
	 * Use the throttled ratio if it has been calculated, otherwise
	 * use the fallback ratio. The throttled ratio is used to avoid
	 * an endless loop of updates at particular viewport heights.
	 * See: https://github.com/WordPress/gutenberg/issues/55112
	 */
	const ratio = ratioState ? ratioState : fallbackRatio;

	const isReady = !! width;

	return (
		<>
			<div style={ { position: 'relative' } }>
				{ containerResizeListener }
			</div>
			{ isReady && (
				<div
					className="global-styles-ui-preview__wrapper"
					style={ {
						height: normalizedHeight * ratio,
					} }
					onMouseEnter={ () => setIsHovered( true ) }
					onMouseLeave={ () => setIsHovered( false ) }
					tabIndex={ -1 }
				>
					<motion.div
						style={ {
							height: normalizedHeight * ratio,
							width: '100%',
							background: gradientValue ?? backgroundColor,
							cursor: withHoverView ? 'pointer' : undefined,
						} }
						initial="start"
						animate={
							( isHovered || isFocused ) &&
							! disableMotion &&
							label
								? 'hover'
								: 'start'
						}
					>
						{ []
							.concat( children as any ) // This makes sure children is always an array.
							.map( ( child: any, key: number ) =>
								child( { ratio, key } )
							) }
					</motion.div>
				</div>
			) }
		</>
	);
}

export default PreviewWrapper;
