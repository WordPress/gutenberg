/**
 * External dependencies
 */
import classnames from 'classnames';

function Animate( { type, options = {}, children } ) {
	if ( type === 'appear' ) {
		const { origin = 'top' } = options;
		const [ yAxis, xAxis = 'center' ] = origin.split( ' ' );

		return children( {
			className: classnames( 'components-animate__appear', {
				[ 'is-from-' + xAxis ]: xAxis !== 'center',
				[ 'is-from-' + yAxis ]: yAxis !== 'middle',
			} ),
		} );
	}

	if ( type === 'slide-in' ) {
		const { origin = 'left' } = options;

		return children( {
			className: classnames(
				'components-animate__slide-in',
				'is-from-' + origin
			),
		} );
	}

	if ( type === 'loading' ) {
		return children( {
			className: classnames( 'components-animate__loading' ),
		} );
	}

	return children( {} );
}

export default Animate;
