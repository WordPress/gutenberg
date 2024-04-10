/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Dropdown, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { safeDecodeURIComponent } from '@wordpress/url';

/**
 * Internal dependencies
 */
import PostURLCheck from './check';
import PostURL from './index';
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';

export default function PostURLPanel() {
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( { anchor: popoverAnchor, placement: 'bottom-end' } ),
		[ popoverAnchor ]
	);

	return (
		<PostURLCheck>
			<PostPanelRow label={ __( 'Slug' ) } ref={ setPopoverAnchor }>
				<Dropdown
					popoverProps={ popoverProps }
					className="editor-post-url__panel-dropdown"
					contentClassName="editor-post-url__panel-dialog"
					focusOnMount
					renderToggle={ ( { isOpen, onToggle } ) => (
						<PostURLToggle isOpen={ isOpen } onClick={ onToggle } />
					) }
					renderContent={ ( { onClose } ) => (
						<PostURL onClose={ onClose } />
					) }
				/>
			</PostPanelRow>
		</PostURLCheck>
	);
}

function PostURLToggle( { isOpen, onClick } ) {
	const slug = useSelect(
		( select ) =>
			safeDecodeURIComponent( select( editorStore ).getEditedPostSlug() ),
		[]
	);
	return (
		<Button
			__next40pxDefaultSize
			className="editor-post-url__panel-toggle"
			variant="tertiary"
			aria-expanded={ isOpen }
			// translators: %s: Current post slug.
			aria-label={ sprintf( __( 'Change slug: %s' ), slug ) }
			onClick={ onClick }
		>
			{ slug }
		</Button>
	);
}
