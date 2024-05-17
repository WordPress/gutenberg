/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	Button,
	Dropdown,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';

export default function PostsPerPagePanel() {
	const { editEntityRecord } = useDispatch( coreStore );
	const postsPerPage = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const siteSettings = getEntityRecord( 'root', 'site' );
		return siteSettings?.posts_per_page;
	}, [] );
	const [ postsCountValue, setPostsCountValue ] = useState( 1 );

	/*
	 * This hook serves to set the server-retrieved postsPerPage
	 * value to local state.
	 */
	useEffect( () => {
		setPostsCountValue( postsPerPage );
	}, [ postsPerPage ] );

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
	const setPostsPerPage = ( newValue ) => {
		setPostsCountValue( newValue );
		editEntityRecord( 'root', 'site', undefined, {
			posts_per_page: newValue,
		} );
	};
	return (
		<PostPanelRow label={ __( 'Posts per page' ) } ref={ setPopoverAnchor }>
			<Dropdown
				popoverProps={ popoverProps }
				contentClassName="editor-site-settings-dropdown__content"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						size="compact"
						variant="tertiary"
						aria-expanded={ isOpen }
						aria-label={ __( 'Change posts per page' ) }
						onClick={ onToggle }
					>
						{ postsCountValue }
					</Button>
				) }
				renderContent={ ( { onClose } ) => (
					<>
						<InspectorPopoverHeader
							title={ __( 'Posts per page' ) }
							onClose={ onClose }
						/>
						<NumberControl
							placeholder={ 0 }
							value={ postsCountValue }
							size={ '__unstable-large' }
							spinControls="custom"
							step="1"
							min="1"
							onChange={ setPostsPerPage }
							label={ __( 'Posts per page' ) }
							help={ __(
								'Set the default number of posts to display on blog pages, including categories and tags. Some templates may override this setting.'
							) }
							hideLabelFromVision
						/>
					</>
				) }
			/>
		</PostPanelRow>
	);
}
