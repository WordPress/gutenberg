import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { store as interfaceStore } from '@wordpress/interface';
import { __, _x, isRTL, sprintf } from '@wordpress/i18n';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { drawerLeft, drawerRight, seen } from '@wordpress/icons';
import HeaderSkeleton from '../header/header-skeleton';
import MoreMenu from '../more-menu';
import PostPreviewButton from '../post-preview-button';
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
	const {
		currentRevisionId,
		isViewingBrowserBackup,
		browserBackupDate,
		sidebarIsOpened,
	} = useSelect( ( select ) => {
		const editor = unlock( select( editorStore ) );
		return {
			currentRevisionId: editor.getCurrentRevisionId(),
			isViewingBrowserBackup: editor.isViewingBrowserBackup(),
			browserBackupDate: editor.getBrowserBackup()?.date,
			sidebarIsOpened:
				!! select( interfaceStore ).getActiveComplementaryArea(
					'core'
				),
		};
	}, [] );

	const { setCurrentRevisionId, restoreRevision, restoreBrowserBackup } =
		unlock( useDispatch( editorStore ) );

	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );

	const canRestore = !! currentRevisionId || isViewingBrowserBackup;

	const handleRestore = () => {
		if ( isViewingBrowserBackup ) {
			restoreBrowserBackup();
		} else if ( currentRevisionId ) {
			restoreRevision( currentRevisionId );
		}
	};

	let browserBackupLabel;
	if ( isViewingBrowserBackup ) {
		browserBackupLabel = browserBackupDate
			? sprintf(
					/* translators: %s: Date and time the backup was made. */
					__( 'Backup in this browser from %s' ),
					dateI18n(
						getDateSettings().formats.datetime,
						browserBackupDate
					)
				)
			: __( 'Backup in this browser' );
	}

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
			center={
				isViewingBrowserBackup ? (
					<span className="editor-revisions-header__no-revisions">
						{ browserBackupLabel }
					</span>
				) : (
					<RevisionsSlider />
				)
			}
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
