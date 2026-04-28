/**
 * WordPress dependencies
 */
import { BlockToolbar } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { createPortal, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Popover,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';
import { store as preferencesStore } from '@wordpress/preferences';
import { VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DocumentTools from './document-tools';
import SaveButton from '../save-button';
import MoreMenu from '../more-menu';
import { unlock } from '../../lock-unlock';

const { __experimentalGetOverlayLegacySlot: getOverlayLegacySlot } = unlock(
	componentsPrivateApis
);

function Header() {
	const isLargeViewport = useViewportMatch( 'medium' );
	const blockToolbarRef = useRef();
	const { hasFixedToolbar } = useSelect(
		( select ) => ( {
			hasFixedToolbar: !! select( preferencesStore ).get(
				'core/edit-widgets',
				'fixedToolbar'
			),
		} ),
		[]
	);

	return (
		<>
			<div className="edit-widgets-header">
				<div className="edit-widgets-header__navigable-toolbar-wrapper">
					{ isLargeViewport && (
						<h1 className="edit-widgets-header__title">
							{ __( 'Widgets' ) }
						</h1>
					) }
					{ ! isLargeViewport && (
						<VisuallyHidden
							className="edit-widgets-header__title"
							render={ <h1 /> }
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
							{ createPortal(
								<Popover.Slot
									ref={ blockToolbarRef }
									name="block-toolbar"
								/>,
								getOverlayLegacySlot()
							) }
						</>
					) }
				</div>
				<div className="edit-widgets-header__actions">
					<PinnedItems.Slot scope="core/edit-widgets" />
					<SaveButton />
					<MoreMenu />
				</div>
			</div>
		</>
	);
}

export default Header;
