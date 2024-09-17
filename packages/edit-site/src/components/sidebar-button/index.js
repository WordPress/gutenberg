/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

export default function SidebarButton( props ) {
	return (
		<Button
			// TODO: Switch to `true` (40px size) if possible
			__next40pxDefaultSize={ false }
			{ ...props }
			className={ clsx( 'edit-site-sidebar-button', props.className ) }
		/>
	);
}
