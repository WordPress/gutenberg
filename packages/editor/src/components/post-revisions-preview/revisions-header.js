/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { Button, __unstableMotion as motion } from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';
import { PinnedItems } from '@wordpress/interface';
import { __, _x } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BackButton, { useHasBackButton } from '../header/back-button';
import MoreMenu from '../more-menu';
import PostPreviewButton from '../post-preview-button';
import PreviewDropdown from '../preview-dropdown';
import RevisionsSlider from './revisions-slider';
import { store as editorStore } from '../../store';
import {
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
	NAVIGATION_POST_TYPE,
} from '../../store/constants';
import { unlock } from '../../lock-unlock';

const toolbarVariations = {
	distractionFreeDisabled: { y: '-50px' },
	distractionFreeHover: { y: 0 },
	distractionFreeHidden: { y: '-50px' },
	visible: { y: 0 },
	hidden: { y: 0 },
};

const backButtonVariations = {
	distractionFreeDisabled: { x: '-100%' },
	distractionFreeHover: { x: 0 },
	distractionFreeHidden: { x: '-100%' },
	visible: { x: 0 },
	hidden: { x: 0 },
};

/**
 * Header component for revisions preview mode.
 *
 * @return {JSX.Element} The revisions header component.
 */
function RevisionsHeader() {
	const isWideViewport = useViewportMatch( 'large' );
	const { postType, showIconLabels, currentRevisionId } = useSelect(
		( select ) => {
			const { get: getPreference } = select( preferencesStore );
			const { getCurrentPostType } = select( editorStore );

			return {
				postType: getCurrentPostType(),
				showIconLabels: getPreference( 'core', 'showIconLabels' ),
				currentRevisionId: unlock(
					select( editorStore )
				).getCurrentRevisionId(),
			};
		},
		[]
	);

	const { setCurrentRevisionId, restoreRevision } = unlock(
		useDispatch( editorStore )
	);

	const disablePreviewOption = [
		NAVIGATION_POST_TYPE,
		TEMPLATE_PART_POST_TYPE,
		PATTERN_POST_TYPE,
	].includes( postType );

	const hasBackButton = useHasBackButton();
	const canRestore = !! currentRevisionId;

	const handleRestore = () => {
		if ( currentRevisionId ) {
			restoreRevision( currentRevisionId );
		}
	};

	return (
		<div className="editor-header edit-post-header">
			{ hasBackButton && (
				<motion.div
					className="editor-header__back-button"
					variants={ backButtonVariations }
					transition={ { type: 'tween' } }
				>
					<BackButton.Slot />
				</motion.div>
			) }
			<motion.div
				variants={ toolbarVariations }
				className="editor-header__toolbar"
				transition={ { type: 'tween' } }
			>
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					size="compact"
					icon={ seen }
					label={ _x( 'Show changes', 'revisions' ) }
					disabled
				/>
			</motion.div>
			<div
				className="editor-header__center"
				style={ { clipPath: 'none' } }
			>
				<RevisionsSlider />
			</div>
			<motion.div
				variants={ toolbarVariations }
				transition={ { type: 'tween' } }
				className="editor-header__settings"
			>
				<PreviewDropdown disabled={ disablePreviewOption } />

				<PostPreviewButton className="editor-header__post-preview-button" />

				{ ( isWideViewport || ! showIconLabels ) && (
					<PinnedItems.Slot scope="core" />
				) }

				<Button
					__next40pxDefaultSize
					variant="secondary"
					size="compact"
					onClick={ () => setCurrentRevisionId( null ) }
				>
					{ __( 'Exit' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					variant="primary"
					size="compact"
					className="editor-revisions-header__restore-button"
					disabled={ ! canRestore }
					onClick={ handleRestore }
				>
					{ __( 'Restore' ) }
				</Button>
				<MoreMenu />
			</motion.div>
		</div>
	);
}

export default RevisionsHeader;
