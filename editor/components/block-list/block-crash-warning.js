/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Warning from '../warning';

const warning = (
	<Warning>
		<p>{ __(
			'This block has encountered an error and cannot be previewed.'
		) }</p>
	</Warning>
);

export default () => warning;
