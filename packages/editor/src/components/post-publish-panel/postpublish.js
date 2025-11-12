/**
 * WordPress dependencies
 */
import {
	PanelBody,
	Button,
	TextControl,
	ExternalLink,
	VisuallyHidden,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useState, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { addQueryArgs, safeDecodeURIComponent } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { useCopyToClipboard } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PostScheduleLabel from '../post-schedule/label';
import { store as editorStore } from '../../store';

const POSTNAME = '%postname%';
const PAGENAME = '%pagename%';

/**
 * Returns URL for a future post.
 *
 * @param {Object} post Post object.
 *
 * @return {string} PostPublish URL.
 */

const getFuturePostUrl = ( post ) => {
	const { slug } = post;

	if ( post.permalink_template.includes( POSTNAME ) ) {
		return post.permalink_template.replace( POSTNAME, slug );
	}

	if ( post.permalink_template.includes( PAGENAME ) ) {
		return post.permalink_template.replace( PAGENAME, slug );
	}

	return post.permalink_template;
};

function CopyButton( { text } ) {
	const [ showCopyConfirmation, setShowCopyConfirmation ] = useState( false );
	const timeoutIdRef = useRef();
	const ref = useCopyToClipboard( text, () => {
		setShowCopyConfirmation( true );
		if ( timeoutIdRef.current ) {
			clearTimeout( timeoutIdRef.current );
		}
		timeoutIdRef.current = setTimeout( () => {
			setShowCopyConfirmation( false );
		}, 4000 );
	} );

	useEffect( () => {
		return () => {
			if ( timeoutIdRef.current ) {
				clearTimeout( timeoutIdRef.current );
			}
		};
	}, [] );

	return (
		<Button __next40pxDefaultSize variant="secondary" ref={ ref }>
			{ showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy' ) }
		</Button>
	);
}

export default function PostPublishPanelPostpublish( {
	focusOnMount,
	children,
} ) {
	const { post, postType, isScheduled } = useSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getCurrentPost,
			isCurrentPostScheduled,
		} = select( editorStore );
		const { getPostType } = select( coreStore );

		return {
			post: getCurrentPost(),
			postType: getPostType( getEditedPostAttribute( 'type' ) ),
			isScheduled: isCurrentPostScheduled(),
		};
	}, [] );

	const postLabel = postType?.labels?.singular_name;
	const viewPostLabel = postType?.labels?.view_item;
	const addNewPostLabel = postType?.labels?.add_new_item;
	const link =
		post.status === 'future' ? getFuturePostUrl( post ) : post.link;
	const addLink = addQueryArgs( 'post-new.php', {
		post_type: post.type,
	} );

	const postLinkRef = useCallback(
		( node ) => {
			if ( focusOnMount && node ) {
				node.focus();
			}
		},
		[ focusOnMount ]
	);

	const postPublishNonLinkHeader = isScheduled ? (
		<>
			{ __( 'is now scheduled. It will go live on' ) }{ ' ' }
			<PostScheduleLabel />.
		</>
	) : (
		__( 'is now live.' )
	);

	return (
		<div className="post-publish-panel__postpublish">
			<PanelBody className="post-publish-panel__postpublish-header">
				<ExternalLink ref={ postLinkRef } href={ link }>
					{ decodeEntities( post.title ) || __( '(no title)' ) }
				</ExternalLink>{ ' ' }
				{ postPublishNonLinkHeader }
			</PanelBody>
			<PanelBody>
				<p className="post-publish-panel__postpublish-subheader">
					<strong>{ __( 'What’s next?' ) }</strong>
				</p>
				<div className="post-publish-panel__postpublish-post-address-container">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						className="post-publish-panel__postpublish-post-address"
						readOnly
						label={ sprintf(
							/* translators: %s: post type singular name */
							__( '%s address' ),
							postLabel
						) }
						value={ safeDecodeURIComponent( link ) }
						onFocus={ ( event ) => event.target.select() }
					/>

					<div className="post-publish-panel__postpublish-post-address__copy-button-wrap">
						<CopyButton text={ link } />
					</div>
				</div>

				<div className="post-publish-panel__postpublish-buttons">
					{ ! isScheduled && (
						<Button
							variant="primary"
							href={ link }
							__next40pxDefaultSize
							icon={ external }
							iconPosition="right"
							target="_blank"
						>
							{ viewPostLabel }
							<VisuallyHidden as="span">
								{
									/* translators: accessibility text */
									__( '(opens in a new tab)' )
								}
							</VisuallyHidden>
						</Button>
					) }
					<Button
						variant={ isScheduled ? 'primary' : 'secondary' }
						__next40pxDefaultSize
						href={ addLink }
					>
						{ addNewPostLabel }
					</Button>
				</div>
			</PanelBody>
			{ children }
		</div>
	);
}
