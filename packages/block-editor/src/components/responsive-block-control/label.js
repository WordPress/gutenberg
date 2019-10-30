/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import { _x, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

const ResponsiveBlockControlLabel = ( { instanceId, property, device, desc } ) => {
	const accessibleLabel = desc || sprintf( _x( 'Controls the %1$s property for %2$s devices.', 'Text labelling a interface as controlling a given layout property (eg: margin) for a given screen size.' ), property, device.label );
	return (
		<Fragment>
			<span aria-describedby={ `rbc-desc-${ instanceId }` }>
				{ device.label }
			</span>
			<span className="screen-reader-text" id={ `rbc-desc-${ instanceId }` }>{ accessibleLabel }</span>
		</Fragment>
	);
};

export default withInstanceId( ResponsiveBlockControlLabel );

