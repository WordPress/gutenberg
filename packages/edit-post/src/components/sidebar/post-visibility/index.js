/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	Dropdown,
	Button,
} from '@wordpress/components';
import {
	PostVisibility as PostVisibilityForm,
	PostVisibilityLabel,
	PostVisibilityCheck,
	usePostVisibilityLabel,
} from '@wordpress/editor';
import { useRef } from '@wordpress/element';

export function PostVisibility() {
	const anchorRef = useRef();
	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<ToolsPanelItem
					ref={ anchorRef }
					className="edit-post-post-visibility"
					label={ __( 'Visibility' ) }
					hasValue={ () => true }
				>
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
								anchorRef,
							} }
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
				</ToolsPanelItem>
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
