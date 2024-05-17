/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { debounce } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import {
	Button,
	Dropdown,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';

const EMPTY_OBJECT = {};

export default function BlogTitlePanel() {
	const { editEntityRecord } = useDispatch( coreStore );
	const { postsPageTitle, postsPageId } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const siteSettings = getEntityRecord( 'root', 'site' );
		const _postsPageRecord = siteSettings?.page_for_posts
			? getEntityRecord(
					'postType',
					'page',
					siteSettings?.page_for_posts
			  )
			: EMPTY_OBJECT;
		return {
			postsPageId: _postsPageRecord?.id,
			postsPageTitle: _postsPageRecord?.title?.rendered,
		};
	}, [] );
	const [ postsPageTitleValue, setPostsPageTitleValue ] = useState( '' );

	/*
	 * This hook serves to set the server-retrieved postsPageTitle
	 * value to local state.
	 */
	useEffect( () => {
		setPostsPageTitleValue( postsPageTitle );
	}, [ postsPageTitle ] );

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

	if ( ! postsPageId ) {
		return null;
	}

	const setPostsPageTitle = ( newValue ) => {
		setPostsPageTitleValue( newValue );
		editEntityRecord( 'postType', 'page', postsPageId, {
			title: newValue,
		} );
	};
	const decodedTitle = decodeEntities( postsPageTitle );
	return (
		<PostPanelRow label={ __( 'Blog title' ) } ref={ setPopoverAnchor }>
			<Dropdown
				popoverProps={ popoverProps }
				contentClassName="editor-site-settings-dropdown__content"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						size="compact"
						variant="tertiary"
						aria-expanded={ isOpen }
						aria-label={ sprintf(
							// translators: %s: Current post link.
							__( 'Change blog title: %s' ),
							decodedTitle
						) }
						onClick={ onToggle }
					>
						{ decodedTitle }
					</Button>
				) }
				renderContent={ ( { onClose } ) => (
					<>
						<InspectorPopoverHeader
							title={ __( 'Blog title' ) }
							onClose={ onClose }
						/>
						<InputControl
							placeholder={ __( 'No Title' ) }
							size={ '__unstable-large' }
							value={ postsPageTitleValue }
							onChange={ debounce( setPostsPageTitle, 300 ) }
							label={ __( 'Blog title' ) }
							help={ __(
								'Set the Posts Page title. Appears in search results, and when the page is shared on social media.'
							) }
							hideLabelFromVision
						/>
					</>
				) }
			/>
		</PostPanelRow>
	);
}
