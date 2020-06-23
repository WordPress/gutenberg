/**
 * WordPress dependencies
 */
import {
	ComplementaryArea,
	ComplementaryAreaMoreMenuItem,
} from '@wordpress/interface';

export default ( { identifier, title, icon, children } ) => {
	return (
		<>
			<ComplementaryArea
				scope="core/edit-site"
				identifier={ identifier }
				title={ title }
				icon={ icon }
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
};
