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
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import HeaderEditMode from '../header-edit-mode';
import SiteIconAndTitle from '../site-icon-and-title';
import SaveButton from '../save-button';

export default function Header() {
	const { canvasMode } = useSelect(
		( select ) => ( {
			canvasMode: select( editSiteStore ).__unstableGetCanvasMode(),
		} ),
		[]
	);
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	return (
		<HStack
			className={ `edit-site-header-wrapper is-canvas-mode-${ canvasMode }` }
			spacing={ 0 }
		>
			<Button
				className={ `edit-site-header__toggle is-canvas-mode-${ canvasMode }` }
				label={ __( 'Toggle Navigation Sidebar' ) }
				onClick={ () => {
					clearSelectedBlock();
					__unstableSetCanvasMode(
						canvasMode === 'view' ? 'edit' : 'view'
					);
				} }
				variant={ canvasMode === 'view' ? 'secondary' : undefined }
			>
				{ canvasMode === 'edit' && (
					<SiteIconAndTitle
						className="edit-site-header__toggle-icon"
						showTitle={ false }
					/>
				) }
				{ canvasMode === 'view' && __( 'Edit' ) }
			</Button>
			<FlexBlock>
				{ canvasMode === 'edit' && <HeaderEditMode /> }
				{ canvasMode === 'view' && (
					<HStack alignment="right">
						<SaveButton />
					</HStack>
				) }
			</FlexBlock>
		</HStack>
	);
}
