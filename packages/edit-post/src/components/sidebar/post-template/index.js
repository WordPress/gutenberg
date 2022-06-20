/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import usePostTemplateForm from './hook';
import PostTemplateForm from './form';

export default function PostTemplate() {
	const anchorRef = useRef();

	const postTemplateForm = usePostTemplateForm();
	const { isVisible, selectedOption } = postTemplateForm;

	if ( ! isVisible ) {
		return null;
	}

	return (
		<PanelRow className="edit-post-post-template" ref={ anchorRef }>
			<span>{ __( 'Template' ) }</span>
			<Dropdown
				popoverProps={ { anchorRef } }
				position="bottom left"
				contentClassName="edit-post-post-template__dialog"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						className="edit-post-post-template__toggle"
						variant="tertiary"
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						{ selectedOption?.label ?? __( '(none)' ) }
					</Button>
				) }
				renderContent={ ( { onClose } ) => (
					<PostTemplateForm
						{ ...postTemplateForm }
						onClose={ onClose }
					/>
				) }
			/>
		</PanelRow>
	);
}
