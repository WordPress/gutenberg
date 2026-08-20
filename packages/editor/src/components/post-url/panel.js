import { useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Dropdown, Button, ExternalLink } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import PostURLCheck from './check';
import PostURL from './index';
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';

/**
 * Renders the `PostURLPanel` component.
 *
 * @return {React.ReactNode} The rendered PostURLPanel component.
 */
export default function PostURLPanel() {
	const { isFrontPage } = useSelect( ( select ) => {
		const { getCurrentPostId } = select( editorStore );
		const { getEditedEntityRecord, canUser } = select( coreStore );
		const siteSettings = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} )
			? getEditedEntityRecord( 'root', 'site' )
			: undefined;
		const _id = getCurrentPostId();
		return {
			isFrontPage: siteSettings?.page_on_front === _id,
		};
	}, [] );
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

	const label = isFrontPage ? __( 'Link' ) : __( 'Slug' );

	return (
		<PostURLCheck>
			<PostPanelRow label={ label } ref={ setPopoverAnchor }>
				{ ! isFrontPage && (
					<Dropdown
						popoverProps={ popoverProps }
						className="editor-post-url__panel-dropdown"
						contentClassName="editor-post-url__panel-dialog"
						focusOnMount
						renderToggle={ ( { isOpen, onToggle } ) => (
							<PostURLToggle
								isOpen={ isOpen }
								onClick={ onToggle }
							/>
						) }
						renderContent={ ( { onClose } ) => (
							<PostURL onClose={ onClose } />
						) }
					/>
				) }
				{ isFrontPage && <FrontPageLink /> }
			</PostPanelRow>
		</PostURLCheck>
	);
}

function PostURLToggle( { isOpen, onClick } ) {
	const { permalink, homeUrl } = useSelect( ( select ) => {
		const { getPermalink } = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );
		const siteSettings = getEditedEntityRecord( 'root', 'site' );

		return {
			permalink: getPermalink(),
			homeUrl: siteSettings?.url || '',
		};
	}, [] );

	const croppedPermalink = permalink?.startsWith( homeUrl )
		? permalink.slice( homeUrl.length )
		: permalink;

	return (
		<Button
			size="compact"
			className="editor-post-url__panel-toggle"
			variant="tertiary"
			aria-expanded={ isOpen }
			aria-label={
				// translators: %s: Current post link.
				sprintf( __( 'Change link: %s' ), croppedPermalink || '' )
			}
			onClick={ onClick }
		>
			{ croppedPermalink }
		</Button>
	);
}

function FrontPageLink() {
	const { postLink } = useSelect( ( select ) => {
		const { getCurrentPost } = select( editorStore );
		return {
			postLink: getCurrentPost()?.link,
		};
	}, [] );

	return (
		<ExternalLink
			className="editor-post-url__front-page-link"
			href={ postLink }
			target="_blank"
		>
			{ postLink }
		</ExternalLink>
	);
}
