/**
 * WordPress dependencies
 */
import {
	ComplementaryArea,
	ComplementaryAreaMoreMenuItem,
} from '@wordpress/interface';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

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
	const { showIconLabels, isDistractionFree } = useSelect( ( select ) => {
		const settings = select( editSiteStore ).getSettings();
		return {
			showIconLabels: settings.showIconLabels,
			isDistractionFree: settings.isDistractionFree,
		};
	}, [] );

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
				headerClassName={ headerClassName }
				panelClassName={ panelClassName }
				showIconLabels={ showIconLabels }
			>
				{ children }
			</ComplementaryArea>
			<ComplementaryAreaMoreMenuItem
				scope="core/edit-site"
				identifier={ identifier }
				icon={ icon }
				disabled={ isDistractionFree }
			>
				{ title }
			</ComplementaryAreaMoreMenuItem>
		</>
	);
}
