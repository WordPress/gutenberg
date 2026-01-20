/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import {
	Button,
	RangeControl,
	Spinner,
	__unstableMotion as motion,
} from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';
import { PinnedItems } from '@wordpress/interface';
import { __, _x } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import BackButton, { useHasBackButton } from '../header/back-button';
import MoreMenu from '../more-menu';
import PostPreviewButton from '../post-preview-button';
import PreviewDropdown from '../preview-dropdown';
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
 * Based on the main Header component but with revision-specific controls.
 *
 * @param {Object}   props                  Component props.
 * @param {Array}    props.revisions        Array of revision objects.
 * @param {Object}   props.selectedRevision The currently selected revision.
 * @param {number}   props.selectedIndex    Index of the selected revision.
 * @param {Function} props.onSelectIndex    Callback when slider value changes.
 * @param {boolean}  props.isLoading        Whether revisions are loading.
 * @param {boolean}  props.showDiff         Whether diff highlighting is enabled.
 * @param {Function} props.onToggleDiff     Callback to toggle diff highlighting.
 * @return {JSX.Element} The revisions header component.
 */
function RevisionsHeader( {
	revisions,
	selectedRevision,
	selectedIndex,
	onSelectIndex,
	isLoading,
	showDiff,
	onToggleDiff,
} ) {
	const isWideViewport = useViewportMatch( 'large' );
	const { postType, showIconLabels } = useSelect( ( select ) => {
		const { get: getPreference } = select( preferencesStore );
		const { getEditorMode, getCurrentPostType } = select( editorStore );
		const { getBlockSelectionStart, getSectionRootClientId } = unlock(
			select( blockEditorStore )
		);

		return {
			postType: getCurrentPostType(),
			isTextEditor: getEditorMode() === 'text',
			showIconLabels: getPreference( 'core', 'showIconLabels' ),
			hasFixedToolbar: getPreference( 'core', 'fixedToolbar' ),
			hasBlockSelection: !! getBlockSelectionStart(),
			hasSectionRootClientId: !! getSectionRootClientId(),
		};
	}, [] );

	const { exitRevisionsMode, restoreRevision } = unlock(
		useDispatch( editorStore )
	);

	const disablePreviewOption = [
		NAVIGATION_POST_TYPE,
		TEMPLATE_PART_POST_TYPE,
		PATTERN_POST_TYPE,
	].includes( postType );

	const hasBackButton = useHasBackButton();

	const hasRevisions = revisions.length > 0;
	const canRestore = selectedRevision && ! isLoading;

	const handleRestore = () => {
		if ( selectedRevision ) {
			restoreRevision( selectedRevision );
		}
	};

	// Format date for tooltip.
	const dateSettings = getDateSettings();
	const renderTooltipContent = ( index ) => {
		const revision = revisions[ index ];
		if ( ! revision ) {
			return index;
		}
		return dateI18n( dateSettings.formats.datetime, revision.date );
	};

	const renderCenterContent = () => {
		if ( isLoading ) {
			return <Spinner />;
		}
		if ( hasRevisions ) {
			return (
				<RangeControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					className="editor-revisions-header__slider"
					hideLabelFromVision
					label={ __( 'Revision' ) }
					max={ revisions.length - 1 }
					min={ 0 }
					marks
					onChange={ onSelectIndex }
					renderTooltipContent={ renderTooltipContent }
					value={ selectedIndex }
					withInputField={ false }
				/>
			);
		}
		return (
			<span className="editor-revisions-header__no-revisions">
				{ __( 'No revisions found.' ) }
			</span>
		);
	};

	/*
	 * The edit-post-header classname is only kept for backward compatibility
	 * as some plugins might be relying on its presence.
	 */
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
					icon={ seen }
					label={ _x( 'Show changes', 'revisions' ) }
					isPressed={ showDiff }
					onClick={ onToggleDiff }
				/>
			</motion.div>
			<div
				className="editor-header__center"
				style={ { clipPath: 'none' } }
			>
				{ renderCenterContent() }
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
					onClick={ exitRevisionsMode }
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
