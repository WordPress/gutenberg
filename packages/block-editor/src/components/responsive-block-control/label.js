/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { _x, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

export default function ResponsiveBlockControlLabel( {
	property,
	viewport,
	desc,
} ) {
	const instanceId = useInstanceId( ResponsiveBlockControlLabel );
	const accessibleLabel =
		desc ||
		sprintf(
			_x(
				'Controls the %1$s property for %2$s viewports.',
				'Text labelling a interface as controlling a given layout property (eg: margin) for a given screen size.'
			),
			property,
			viewport.label
		);
	return (
		<Fragment>
			<span aria-describedby={ `rbc-desc-${ instanceId }` }>
				{ viewport.label }
			</span>
			<span
				className="screen-reader-text"
				id={ `rbc-desc-${ instanceId }` }
			>
				{ accessibleLabel }
			</span>
		</Fragment>
	);
}
