import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { store as interfaceStore } from '@wordpress/interface';
import { __, _x, isRTL } from '@wordpress/i18n';
import { drawerLeft, drawerRight, seen } from '@wordpress/icons';
import HeaderSkeleton from '../header/header-skeleton';
import MoreMenu from '../more-menu';
import PostPreviewButton from '../post-preview-button';
import PluginPostRevisionHeader from '../plugin-post-revision-header';
import usePluginPostRevisionInfoContext from '../plugin-post-revision-info/use-plugin-post-revision-info-context';
import RevisionsSlider from './revisions-slider';
import { store as editorStore } from '../../store';
import { sidebars } from '../sidebar/constants';
import { unlock } from '../../lock-unlock';

/**
 * Header component for revisions preview mode.
 *
 * @param {Object}   props              Component props.
 * @param {boolean}  props.showDiff     Whether diff highlighting is enabled.
 * @param {Function} props.onToggleDiff Callback to toggle diff highlighting.
 * @return {React.JSX.Element} The revisions header component.
 */
function RevisionsHeader( { showDiff, onToggleDiff } ) {
	const context = usePluginPostRevisionInfoContext();
	const sidebarIsOpened = useSelect(
		( select ) =>
			!! select( interfaceStore ).getActiveComplementaryArea( 'core' ),
		[]
	);

	const { setCurrentRevisionId, restoreRevision } = unlock(
		useDispatch( editorStore )
	);

	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );

	const canRestore = !! context.revisionId;

	const handleRestore = () => {
		if ( context.revisionId ) {
			restoreRevision( context.revisionId );
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
					<PostPreviewButton className="editor-header__post-preview-button" />

					<Button
						__next40pxDefaultSize
						icon={ isRTL() ? drawerLeft : drawerRight }
						label={ _x( 'Settings', 'panel button label' ) }
						isPressed={ sidebarIsOpened }
						aria-expanded={ sidebarIsOpened }
						onClick={ () => {
							if ( sidebarIsOpened ) {
								disableComplementaryArea( 'core' );
							} else {
								enableComplementaryArea(
									'core',
									sidebars.document
								);
							}
						} }
						size="compact"
					/>

					<PluginPostRevisionHeader.Slot fillProps={ { context } } />

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
					<MoreMenu isRevisionMode />
				</>
			}
		/>
	);
}

export default RevisionsHeader;
