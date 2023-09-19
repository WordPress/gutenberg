/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { ProgressBar } = unlock( componentsPrivateApis );

export default function CanvasLoader( { id } ) {
	const { elapsed, total } = useSelect( ( select ) => {
		const selectorsByStatus = select( coreStore ).countSelectorsByStatus();
		const resolving = selectorsByStatus.resolving ?? 0;
		const finished = selectorsByStatus.finished ?? 0;
		return {
			elapsed: finished,
			total: finished + resolving,
		};
	}, [] );

	return (
		<div className="edit-site-canvas-loader">
			<ProgressBar id={ id } max={ total } value={ elapsed } />
		</div>
	);
}
