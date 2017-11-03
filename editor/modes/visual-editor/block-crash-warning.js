/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockWarning from './block-warning';

const warning = (
	<BlockWarning>
		<p>{ __(
			'This block has suffered from an unhandled error and cannot be previewed.'
		) }</p>
	</BlockWarning>
);

export default () => warning;
