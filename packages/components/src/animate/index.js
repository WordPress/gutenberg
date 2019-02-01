/**
 * External dependencies
 */
import classnames from 'classnames';

function Animate( { type, options = {}, children } ) {
	if ( type === 'appear' ) {
		const { origin = 'top' } = options;
		const [ yAxis, xAxis = 'center' ] = origin.split( ' ' );

		return children( {
			className: classnames(
				'components-animate__appear',
				{
					[ 'is-from-' + xAxis ]: xAxis !== 'center',
					[ 'is-from-' + yAxis ]: yAxis !== 'middle',
				},
			),
		} );
	}

	return children( {} );
}

export default Animate;
