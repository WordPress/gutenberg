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
		{ __(
			'This block has suffered from an unhandled error and cannot be previewed.'
		) }
	</BlockWarning>
);

export default () => warning;
