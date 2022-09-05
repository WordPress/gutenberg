/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	PostURLCheck,
	PostURL as PostURLForm,
	usePostURLLabel,
} from '@wordpress/editor';

export default function PostURL() {
	// Use internal state instead of a ref to make sure that the component
	// re-renders when then anchor's ref updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState();

	return (
		<PostURLCheck>
			<PanelRow className="edit-post-post-url" ref={ setPopoverAnchor }>
				<span>{ __( 'URL' ) }</span>
				<Dropdown
					popoverProps={ {
						// `anchor` can not be `null`
						anchor: popoverAnchor ?? undefined,
					} }
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
