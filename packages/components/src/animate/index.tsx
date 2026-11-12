import clsx from 'clsx';
import deprecated from '@wordpress/deprecated';
import type { AnimateProps, GetAnimateOptions } from './types';

/**
 * @param type The animation type
 * @return Default origin
 */
function getDefaultOrigin( type?: GetAnimateOptions[ 'type' ] ) {
	return type === 'appear' ? 'top' : 'left';
}

/**
 * @param options
 *
 * @return ClassName that applies the animations
 */
export function getAnimateClassName( options: GetAnimateOptions ) {
	if ( options.type === 'loading' ) {
		return 'components-animate__loading';
	}

	const { type, origin = getDefaultOrigin( type ) } = options;

	if ( type === 'appear' ) {
		const [ yAxis, xAxis = 'center' ] = origin.split( ' ' );
		return clsx( 'components-animate__appear', {
			[ 'is-from-' + xAxis ]: xAxis !== 'center',
			[ 'is-from-' + yAxis ]: yAxis !== 'middle',
		} );
	}

	if ( type === 'slide-in' ) {
		return clsx( 'components-animate__slide-in', 'is-from-' + origin );
	}

	return undefined;
}

/**
 * Simple interface to introduce animations to components.
 *
 * This component is deprecated. Write your own CSS animations instead,
 * preferably using the [motion tokens](https://wordpress.github.io/gutenberg/?path=/docs/design-system-tokens-introduction--docs)
 * available in `@wordpress/theme`.
 *
 * @deprecated
 *
 * ```jsx
 * import { Animate, Notice } from '@wordpress/components';
 *
 * const MyAnimatedNotice = () => (
 * 	<Animate type="slide-in" options={ { origin: 'top' } }>
 * 		{ ( { className } ) => (
 * 			<Notice className={ className } status="success">
 * 				<p>Animation finished.</p>
 * 			</Notice>
 * 		) }
 * 	</Animate>
 * );
 * ```
 */
export function Animate( { type, options = {}, children }: AnimateProps ) {
	deprecated( 'wp.components.Animate', {
		since: '7.2',
		version: '7.4',
	} );

	return children( {
		className: getAnimateClassName( {
			type,
			...options,
		} as GetAnimateOptions ),
	} );
}

export default Animate;
