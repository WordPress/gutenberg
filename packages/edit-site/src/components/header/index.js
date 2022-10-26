/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalHStack as HStack, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import HeaderEditMode from '../header-edit-mode';
import DocumentActions from '../header-edit-mode/document-actions';

export default function Header() {
	const { canvasMode } = useSelect(
		( select ) => ( {
			canvasMode: select( editSiteStore ).__unstableGetCanvasMode(),
		} ),
		[]
	);
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );

	return (
		<div
			className={ `edit-site-header-wrapper is-canvas-mode-${ canvasMode }` }
		>
			{ canvasMode === 'edit' && <HeaderEditMode /> }
			{ canvasMode === 'view' && (
				<HStack justify="space-between">
					<Button
						label={ __( 'Open the editor' ) }
						onClick={ () => {
							__unstableSetCanvasMode( 'edit' );
						} }
						variant="secondary"
					>
						{ __( 'Edit' ) }
					</Button>
					<DocumentActions showDropdown={ false } />
					<div />
				</HStack>
			) }
		</div>
	);
}
