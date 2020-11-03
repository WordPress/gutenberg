/**
 * WordPress dependencies
 */
import {
	ComplementaryArea,
	ComplementaryAreaMoreMenuItem,
} from '@wordpress/interface';

export default function DefaultSidebar( {
	className,
	identifier,
	title,
	icon,
	children,
	closeLabel,
	header,
} ) {
	return (
		<>
			<ComplementaryArea
				className={ className }
				scope="core/edit-site"
				identifier={ identifier }
				title={ title }
				icon={ icon }
				closeLabel={ closeLabel }
				header={ header }
			>
				{ children }
			</ComplementaryArea>
			<ComplementaryAreaMoreMenuItem
				scope="core/edit-site"
				identifier={ identifier }
				icon={ icon }
			>
				{ title }
			</ComplementaryAreaMoreMenuItem>
		</>
	);
}
