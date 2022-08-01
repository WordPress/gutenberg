/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import {
	PostVisibility as PostVisibilityForm,
	PostVisibilityLabel,
	PostVisibilityCheck,
	usePostVisibilityLabel,
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
							focusOnMount
							renderToggle={ ( { isOpen, onToggle } ) => (
								<PostVisibilityToggle
									isOpen={ isOpen }
									onClick={ onToggle }
								/>
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

function PostVisibilityToggle( { isOpen, onClick } ) {
	const label = usePostVisibilityLabel();
	return (
		<Button
			className="edit-post-post-visibility__toggle"
			variant="tertiary"
			aria-expanded={ isOpen }
			// translators: %s: Current post visibility.
			aria-label={ sprintf( __( 'Select visibility: %s' ), label ) }
			onClick={ onClick }
		>
			{ label }
		</Button>
	);
}

export default PostVisibility;
