import { ProgressBar } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { unlock } from '../../lock-unlock';

const { useStyle } = unlock( editorPrivateApis );

export default function CanvasLoader( { id } ) {
	const textColor = useStyle( 'color.text' );
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
		<div
			className="edit-site-canvas-loader"
			style={ textColor ? { '--color': textColor } : undefined }
		>
			<ProgressBar id={ id } max={ total } value={ elapsed } />
		</div>
	);
}
