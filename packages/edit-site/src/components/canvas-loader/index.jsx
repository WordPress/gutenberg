import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components -- Migrate the canvas loader to Progress with a theme-colored indicator.
import { Progress } from '@wordpress/ui';
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
		<div className="edit-site-canvas-loader">
			<Progress.Root
				id={ id }
				className="edit-site-canvas-loader__progress"
				aria-label={ __( 'Loading editor' ) }
				max={ total }
				value={ elapsed }
			>
				<Progress.Track>
					<Progress.Indicator color={ textColor } />
				</Progress.Track>
			</Progress.Root>
		</div>
	);
}
