/**
 * WordPress dependencies
 */
import { BlockToolbar } from '@wordpress/block-editor';
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
import DocumentTools from './document-tools';
import SaveButton from '../save-button';
import MoreMenu from '../more-menu';

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
					<PinnedItems.Slot scope="core/edit-widgets" />
					<SaveButton />
					<MoreMenu />
				</div>
			</div>
		</>
	);
}

export default Header;
