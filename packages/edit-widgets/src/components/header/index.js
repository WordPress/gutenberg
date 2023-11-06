/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Slot, VisuallyHidden } from '@wordpress/components';
import { PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import DocumentTools from './document-tools';
import SaveButton from '../save-button';
import MoreMenu from '../more-menu';

function Header( { setListViewToggleElement } ) {
	const isMediumViewport = useViewportMatch( 'medium' );
	const isLargeViewport = useViewportMatch( 'large' );
	const { hasFixedToolbar } = useSelect(
		( select ) => ( {
			hasFixedToolbar: !! select( preferencesStore ).get(
				'core/edit-widgets',
				'fixedToolbar'
			),
		} ),
		[]
	);

	const hasToolbarSlot = hasFixedToolbar && isLargeViewport;

	return (
		<>
			<div className="edit-widgets-header">
				<div
					role={ hasToolbarSlot ? 'menu' : undefined }
					className="edit-widgets-header__navigable-toolbar-wrapper"
				>
					{ isMediumViewport && (
						<h1 className="edit-widgets-header__title">
							{ __( 'Widgets' ) }
						</h1>
					) }
					{ ! isMediumViewport && (
						<VisuallyHidden
							as="h1"
							className="edit-widgets-header__title"
						>
							{ __( 'Widgets' ) }
						</VisuallyHidden>
					) }
					<DocumentTools
						setListViewToggleElement={ setListViewToggleElement }
					/>
					{ hasToolbarSlot && (
						<Slot
							className="selected-block-tools-wrapper"
							name="__experimentalSelectedBlockTools"
							bubblesVirtually
						/>
					) }
				</div>
				<div className="edit-widgets-header__actions">
					<SaveButton />
					<PinnedItems.Slot scope="core/edit-widgets" />
					<MoreMenu />
				</div>
			</div>
		</>
	);
}

export default Header;
