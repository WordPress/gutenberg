/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	Button,
	Dropdown,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { store as editorStore } from '../../store';
import PostPanelRow from '../post-panel-row';

export default function PostsPerPage() {
	const { editEntityRecord } = useDispatch( coreStore );
	const {
		isTemplate,
		postSlug,
		templateId,
		postsPerPage,
		globalPostsPerPage,
	} = useSelect( ( select ) => {
		const { getEditedPostAttribute, getCurrentPostId, getCurrentPostType } =
			select( editorStore );
		const {
			getEntityRecord,
			getEntityRecordEdits,
			getEditedEntityRecord,
			canUser,
		} = select( coreStore );
		const siteSettings = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} )
			? getEditedEntityRecord( 'root', 'site' )
			: undefined;
		const slug = getEditedPostAttribute( 'slug' );

		const id = getCurrentPostId();
		const perPage = getEntityRecord(
			'postType',
			TEMPLATE_POST_TYPE,
			id,
			{ combinedTemplates: false }
		)?.posts_per_page;
		const editedPerPage = getEntityRecordEdits(
			'postType',
			TEMPLATE_POST_TYPE,
			id
		)?.posts_per_page;

		return {
			isTemplate: getCurrentPostType() === TEMPLATE_POST_TYPE,
			postSlug: slug,
			templateId: id,
			postsPerPage: editedPerPage || perPage,
			globalPostsPerPage: siteSettings?.posts_per_page || 1,
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

	if (
		! isTemplate ||
		! [
			'home',
			'index',
			'author',
			'category',
			'tag',
			'taxonomy',
			'date',
			'search',
			'archive',
		].some(
			( slug ) => postSlug === slug || postSlug?.startsWith( slug + '-' )
		)
	) {
		return null;
	}

	const handleSetPostsPerPage = ( newPostsPerPage ) => {
		if ( newPostsPerPage ) {
			newPostsPerPage = Number( newPostsPerPage );
		}
		editEntityRecord( 'postType', TEMPLATE_POST_TYPE, templateId, {
			posts_per_page: newPostsPerPage,
		} );
	};
	return (
		<PostPanelRow label={ __( 'Posts per page' ) } ref={ setPopoverAnchor }>
			<Dropdown
				popoverProps={ popoverProps }
				contentClassName="editor-posts-per-page-dropdown__content"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						size="compact"
						variant="tertiary"
						aria-expanded={ isOpen }
						aria-label={ __( 'Change posts per page' ) }
						onClick={ onToggle }
					>
						{ postsPerPage || `Default ${ globalPostsPerPage }` }
					</Button>
				) }
				renderContent={ ( { onClose } ) => (
					<>
						<InspectorPopoverHeader
							title={ __( 'Posts per page' ) }
							onClose={ onClose }
						/>
						<NumberControl
							placeholder={ `Default ${ globalPostsPerPage }` }
							value={ postsPerPage }
							size="__unstable-large"
							spinControls="custom"
							step="1"
							min="0"
							onChange={ handleSetPostsPerPage }
							label={ __( 'Posts per page' ) }
							help={ __(
								'Set the number of posts to display per page. Leave empty to use the site default.'
							) }
							hideLabelFromVision
						/>
					</>
				) }
			/>
		</PostPanelRow>
	);
}
