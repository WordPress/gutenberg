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
			__next40pxDefaultSize
			{ ...props }
			className={ clsx( 'edit-site-sidebar-button', props.className ) }
		/>
	);
}
