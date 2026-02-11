/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';
import { PinnedItems } from '@wordpress/interface';
import { __, _x } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import HeaderSkeleton from '../header/header-skeleton';
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

/**
 * Header component for revisions preview mode.
 *
 * @param {Object}   props              Component props.
 * @param {boolean}  props.showDiff     Whether diff highlighting is enabled.
 * @param {Function} props.onToggleDiff Callback to toggle diff highlighting.
 * @return {JSX.Element} The revisions header component.
 */
function RevisionsHeader( { showDiff, onToggleDiff } ) {
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

	const canRestore = !! currentRevisionId;

	const handleRestore = () => {
		if ( currentRevisionId ) {
			restoreRevision( currentRevisionId );
		}
	};

	return (
		<HeaderSkeleton
			className="editor-revisions-header"
			toolbar={
				<Button
					__next40pxDefaultSize
					size="compact"
					icon={ seen }
					label={ _x( 'Show changes', 'revisions' ) }
					isPressed={ showDiff }
					onClick={ onToggleDiff }
				/>
			}
			center={ <RevisionsSlider /> }
			settings={
				<>
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
					<MoreMenu disabled />
				</>
			}
		/>
	);
}

export default RevisionsHeader;
