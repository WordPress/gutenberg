/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import createBlockWarning from './create-block-warning';

const warning = createBlockWarning( __(
	'This block has suffered from an unhandled error and cannot be previewed.'
) );

export default () => warning;
