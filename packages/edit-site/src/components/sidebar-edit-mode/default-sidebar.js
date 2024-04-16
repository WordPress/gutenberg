/**
 * WordPress dependencies
 */
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { ComplementaryArea, ComplementaryAreaMoreMenuItem } =
	unlock( editorPrivateApis );

export default function DefaultSidebar( {
	className,
	identifier,
	title,
	icon,
	children,
	closeLabel,
	header,
	headerClassName,
	panelClassName,
} ) {
	return (
		<>
			<ComplementaryArea
				className={ className }
				scope="core/edit-site"
				identifier={ identifier }
				title={ title }
				smallScreenTitle={ title }
				icon={ icon }
				closeLabel={ closeLabel }
				header={ header }
				headerClassName={ headerClassName }
				panelClassName={ panelClassName }
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
