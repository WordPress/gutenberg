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
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { PostPanelRow } = unlock( editorPrivateApis );

export function PostVisibility() {
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			placement: 'bottom-end',
		} ),
		[ popoverAnchor ]
	);

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PostPanelRow
					label={ __( 'Visibility' ) }
					ref={ setPopoverAnchor }
				>
					{ ! canEdit && (
						<span>
							<PostVisibilityLabel />
						</span>
					) }
					{ canEdit && (
						<Dropdown
							contentClassName="edit-post-post-visibility__dialog"
							popoverProps={ popoverProps }
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
				</PostPanelRow>
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
