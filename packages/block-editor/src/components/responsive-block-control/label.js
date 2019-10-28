/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

const ResponsiveBlockControlLabel = ( { instanceId, property, device } ) => {
	const accessibleLabel = sprintf( __( 'Controls the %s property for %s devices.' ), property, device );
	return (
		<Fragment>
			<span aria-describedby={ `rbc-desc-${ instanceId }` }>
				{ device }
			</span>
			<span className="screen-reader-text" id={ `rbc-desc-${ instanceId }` }>{ accessibleLabel }</span>
		</Fragment>
	);
};

export default withInstanceId( ResponsiveBlockControlLabel );

