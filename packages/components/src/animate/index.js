/**
 * External dependencies
 */
import classnames from 'classnames';

function getDefaultOrigin( type ) {
	return type === 'appear' ? 'top' : 'left';
}

export function useAnimate( { type, origin = getDefaultOrigin( type ) } ) {
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

	if ( type === 'loading' ) {
		return classnames( 'components-animate__loading' );
	}
}

export default function Animate( { type, options = {}, children } ) {
	return children( {
		className: useAnimate( { type, ...options } ),
	} );
}
