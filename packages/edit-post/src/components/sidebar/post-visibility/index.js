/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import {
	PostVisibility as PostVisibilityForm,
	PostVisibilityLabel,
	PostVisibilityCheck,
} from '@wordpress/editor';
import { useRef } from '@wordpress/element';

export function PostVisibility() {
	const rowRef = useRef();
	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PanelRow ref={ rowRef } className="edit-post-post-visibility">
					<span>{ __( 'Visibility' ) }</span>
					{ ! canEdit && (
						<span>
							<PostVisibilityLabel />
						</span>
					) }
					{ canEdit && (
						<Dropdown
							position="bottom left"
							contentClassName="edit-post-post-visibility__dialog"
							popoverProps={ {
								// Anchor the popover to the middle of the
								// entire row so that it doesn't move around
								// when the label changes.
								anchorRef: rowRef.current,
							} }
							renderToggle={ ( { isOpen, onToggle } ) => (
								<Button
									aria-expanded={ isOpen }
									className="edit-post-post-visibility__toggle"
									onClick={ onToggle }
									variant="tertiary"
								>
									<PostVisibilityLabel />
								</Button>
							) }
							renderContent={ ( { onClose } ) => (
								<PostVisibilityForm onClose={ onClose } />
							) }
						/>
					) }
				</PanelRow>
			) }
		/>
	);
}

export default PostVisibility;
