/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	Dropdown,
	Button,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { safeDecodeURIComponent } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostURLCheck from './check';
import PostURL from './index';
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';

/**
 * Renders the `PostURLPanel` component.
 *
 * @return {JSX.Element} The rendered PostURLPanel component.
 */
export default function PostURLPanel() {
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			placement: 'left-start',
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);

	return (
		<PostURLCheck>
			<PostPanelRow label={ __( 'Link' ) } ref={ setPopoverAnchor }>
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
	const { slug, isFrontPage, postLink } = useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPost } = select( editorStore );
		const { getEditedEntityRecord, canUser } = select( coreStore );
		const siteSettings = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} )
			? getEditedEntityRecord( 'root', 'site' )
			: undefined;
		const _id = getCurrentPostId();
		return {
			slug: select( editorStore ).getEditedPostSlug(),
			isFrontPage: siteSettings?.page_on_front === _id,
			postLink: getCurrentPost()?.link,
		};
	}, [] );
	const decodedSlug = safeDecodeURIComponent( slug );
	return (
		<Button
			size="compact"
			className="editor-post-url__panel-toggle"
			variant="tertiary"
			aria-expanded={ isOpen }
			// translators: %s: Current post link.
			aria-label={ sprintf( __( 'Change link: %s' ), decodedSlug ) }
			onClick={ onClick }
		>
			<Truncate numberOfLines={ 1 }>
				{ isFrontPage ? postLink : `/${ decodedSlug }` }
			</Truncate>
		</Button>
	);
}
