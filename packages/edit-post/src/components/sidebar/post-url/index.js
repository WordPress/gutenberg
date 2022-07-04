/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	PostURLCheck,
	PostURLLabel,
	PostURL as PostURLForm,
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
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							className="edit-post-post-url__toggle"
							variant="tertiary"
							aria-expanded={ isOpen }
							onClick={ onToggle }
						>
							<PostURLLabel />
						</Button>
					) }
					renderContent={ ( { onClose } ) => (
						<PostURLForm onClose={ onClose } />
					) }
				/>
			</PanelRow>
		</PostURLCheck>
	);
}
