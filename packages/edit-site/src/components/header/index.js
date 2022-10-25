/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	__experimentalHStack as HStack,
	Button,
	FlexBlock,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import HeaderEditMode from '../header-edit-mode';
import SaveButton from '../save-button';
import DocumentActions from '../header-edit-mode/document-actions';
import HomeButton from '../home-button';

export default function Header() {
	const { canvasMode } = useSelect(
		( select ) => ( {
			canvasMode: select( editSiteStore ).__unstableGetCanvasMode(),
		} ),
		[]
	);
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );

	return (
		<HStack
			className={ `edit-site-header-wrapper is-canvas-mode-${ canvasMode }` }
		>
			{ canvasMode === 'view' && (
				<Button
					label={ __( 'Open the editor' ) }
					onClick={ () => {
						__unstableSetCanvasMode( 'edit' );
					} }
					variant="secondary"
				>
					{ __( 'Edit' ) }
				</Button>
			) }
			<FlexBlock>
				{ canvasMode === 'edit' && <HeaderEditMode /> }
				{ canvasMode === 'view' && (
					<HStack justify="space-between">
						<div>
							<HomeButton />
						</div>
						<DocumentActions showDropdown={ false } />
						<SaveButton />
					</HStack>
				) }
			</FlexBlock>
		</HStack>
	);
}
