/**
 * WordPress dependencies
 */
import { Dropdown, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	PostURLCheck,
	PostURL as PostURLForm,
	usePostURLLabel,
} from '@wordpress/editor';

export default function PostURL() {
	return (
		<PostURLCheck>
			<span>{ __( 'URL' ) }</span>
			<Dropdown
				position="bottom left"
				className="edit-post-post-url__dropdown"
				contentClassName="edit-post-post-url__dialog"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<PostURLToggle isOpen={ isOpen } onClick={ onToggle } />
				) }
				renderContent={ ( { onClose } ) => (
					<PostURLForm onClose={ onClose } />
				) }
			/>
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
