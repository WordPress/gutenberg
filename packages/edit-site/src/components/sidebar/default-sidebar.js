/**
 * WordPress dependencies
 */
import {
	ComplementaryArea,
	ComplementaryAreaMoreMenuItem,
} from '@wordpress/interface';

export default function DefaultSidebar( {
	className,
	scope,
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
				scope={ scope }
				identifier={ identifier }
				title={ title }
				icon={ icon }
				closeLabel={ closeLabel }
				header={ header }
				headerClassName={ headerClassName }
				panelClassName={ panelClassName }
			>
				{ children }
			</ComplementaryArea>
			<ComplementaryAreaMoreMenuItem
				scope={ scope }
				identifier={ identifier }
				icon={ icon }
			>
				{ title }
			</ComplementaryAreaMoreMenuItem>
		</>
	);
}
