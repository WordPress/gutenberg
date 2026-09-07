import clsx from 'clsx';
import { Button } from '@wordpress/components';

export default function SidebarButton( props ) {
	return (
		<Button
			size="compact"
			{ ...props }
			className={ clsx( 'edit-site-sidebar-button', props.className ) }
		/>
	);
}
