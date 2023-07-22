/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
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
		return classnames( 'components-animate__loading' );
	}

	const { type, origin = getDefaultOrigin( type ) } = options;

	if ( type === 'appear' ) {
		const [ yAxis, xAxis = 'center' ] = origin.split( ' ' );
		return classnames( 'components-animate__appear', {
			[ 'is-from-' + xAxis ]: xAxis !== 'center',
			[ 'is-from-' + yAxis ]: yAxis !== 'middle',
		} );
	}

	if ( type === 'slide-in' ) {
		return classnames(
			'components-animate__slide-in',
			'is-from-' + origin
		);
	}

	return undefined;
}

/**
 * Simple interface to introduce animations to components.
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
	return children( {
		className: getAnimateClassName( {
			type,
			...options,
		} as GetAnimateOptions ),
	} );
}

export default Animate;
