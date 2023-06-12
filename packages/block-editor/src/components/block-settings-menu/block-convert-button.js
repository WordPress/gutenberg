/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { DropdownMenuItemV2 } = unlock( componentsPrivateApis );

export default function BlockConvertButton( { shouldRender, onClick, small } ) {
	if ( ! shouldRender ) {
		return null;
	}

	const label = __( 'Convert to Blocks' );
	return (
		/* TODO: check if this used in other legacy dropdown menus */
		<DropdownMenuItemV2 onSelect={ onClick }>
			{ ! small && label }
		</DropdownMenuItemV2>
	);
}
