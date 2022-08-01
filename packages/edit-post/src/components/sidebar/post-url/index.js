/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	PostURLCheck,
	PostURL as PostURLForm,
	usePostURLLabel,
} from '@wordpress/editor';

export default function PostURL() {
	const anchorRef = useRef();
	return (
		<PostURLCheck>
			<PanelRow className="edit-post-post-url" ref={ anchorRef }>
				<span>{ __( 'URL' ) }</span>
				<Dropdown
					popoverProps={ { anchorRef } }
					position="bottom left"
					className="edit-post-post-url__dropdown"
					contentClassName="edit-post-post-url__dialog"
					focusOnMount
					renderToggle={ ( { isOpen, onToggle } ) => (
						<PostURLToggle isOpen={ isOpen } onClick={ onToggle } />
					) }
					renderContent={ ( { onClose } ) => (
						<PostURLForm onClose={ onClose } />
					) }
				/>
			</PanelRow>
		</PostURLCheck>
	);
}

function PostURLToggle( { isOpen, onClick } ) {
	const label = usePostURLLabel();
	return (
		<Button
			className="edit-post-post-url__toggle"
			variant="tertiary"
			aria-expanded={ isOpen }
			// translators: %s: Current post URL.
			aria-label={ sprintf( __( 'Change URL: %s' ), label ) }
			onClick={ onClick }
		>
			{ label }
		</Button>
	);
}
