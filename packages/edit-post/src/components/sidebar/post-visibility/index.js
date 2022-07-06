/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';
import {
	PostVisibility as PostVisibilityForm,
	PostVisibilityLabel,
	PostVisibilityCheck,
	usePostVisibilityLabel,
} from '@wordpress/editor';

export function PostVisibility() {
	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<>
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
				</>
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
