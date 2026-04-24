/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	ProgressBar,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Theme } = unlock( componentsPrivateApis );
const { useStyle } = unlock( editorPrivateApis );

export default function CanvasLoader( { id } ) {
	const textColor = useStyle( 'color.text' );
	const backgroundColor = useStyle( 'color.background' );
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
			<Theme accent={ textColor } background={ backgroundColor }>
				<ProgressBar id={ id } max={ total } value={ elapsed } />
			</Theme>
		</div>
	);
}
