/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { grid } from '@wordpress/icons';

export default function BlockConvertButton( { shouldRender, onClick, small } ) {
	if ( ! shouldRender ) {
		return null;
	}

	const label = __( 'Convert to Blocks' );
	return (
		<MenuItem onClick={ onClick } icon={ grid }>
			{ ! small && label }
		</MenuItem>
	);
}
