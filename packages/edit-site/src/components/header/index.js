/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	__unstableAnimatePresence as AnimatePresence,
	__experimentalHStack as HStack,
	__unstableMotion as motion,
	Button,
	FlexBlock,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useReducedMotion } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import HeaderEditMode from '../header-edit-mode';
import SiteIconAndTitle from '../site-icon-and-title';

export default function Header() {
	const { canvasMode } = useSelect(
		( select ) => ( {
			canvasMode: select( editSiteStore ).__unstableGetCanvasMode(),
		} ),
		[]
	);
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );
	const disableMotion = useReducedMotion();

	return (
		<HStack className="edit-site-header-wrapper" spacing={ 0 }>
			<Button
				className={ `edit-site-header__toggle is-canvas-mode-${ canvasMode }` }
				label={ __( 'Toggle Navigation Sidebar' ) }
				onClick={ () =>
					__unstableSetCanvasMode(
						canvasMode === 'view' ? 'edit' : 'view'
					)
				}
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
				<AnimatePresence>
					{ canvasMode === 'edit' && (
						<motion.div
							initial={ { opacity: 0 } }
							animate={ { opacity: 1 } }
							exit={ {
								opacity: 0,
							} }
							transition={ {
								type: 'tween',
								duration: disableMotion ? 0 : 0.5,
							} }
						>
							<HeaderEditMode />
						</motion.div>
					) }
				</AnimatePresence>
			</FlexBlock>
		</HStack>
	);
}
