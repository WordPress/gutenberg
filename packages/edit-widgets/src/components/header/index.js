/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BlockToolbar } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Popover, VisuallyHidden } from '@wordpress/components';
import { PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';
import MoreMenu from '../more-menu';
import { unlock } from '../../lock-unlock';

const { DocumentTools } = unlock( editorPrivateApis );

function Header() {
	const isLargeViewport = useViewportMatch( 'medium' );
	const blockToolbarRef = useRef();
	const { hasFixedToolbar, showIconLabels } = useSelect( ( select ) => {
		const { get: getPreference } = select( preferencesStore );

		return {
			hasFixedToolbar: !! getPreference(
				'core/edit-widgets',
				'fixedToolbar'
			),
			showIconLabels: getPreference( 'core', 'showIconLabels' ),
		};
	}, [] );

	return (
		<>
			<div
				className={ classnames( 'edit-widgets-header', {
					'show-icon-labels': showIconLabels,
				} ) }
			>
				<div className="edit-widgets-header__toolbar">
					{ isLargeViewport && (
						<h1 className="edit-widgets-header__title">
							{ __( 'Widgets' ) }
						</h1>
					) }
					{ ! isLargeViewport && (
						<VisuallyHidden
							as="h1"
							className="edit-widgets-header__title"
						>
							{ __( 'Widgets' ) }
						</VisuallyHidden>
					) }
					<DocumentTools />
					{ hasFixedToolbar && isLargeViewport && (
						<>
							<div className="selected-block-tools-wrapper">
								<BlockToolbar hideDragHandle />
							</div>
							<Popover.Slot
								ref={ blockToolbarRef }
								name="block-toolbar"
							/>
						</>
					) }
				</div>
				<div className="edit-widgets-header__actions">
					<SaveButton />
					<PinnedItems.Slot scope="core/edit-widgets" />
					<MoreMenu showIconLabels={ showIconLabels } />
				</div>
			</div>
		</>
	);
}

export default Header;
