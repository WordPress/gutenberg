/**
 * WordPress dependencies
 */
import { Button, TextControl, VisuallyHidden } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';
import { addQueryArgs, safeDecodeURIComponent } from '@wordpress/url';
import { useCopyToClipboard } from '@wordpress/compose';
import { external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { PostPublishNextPanelTemplate } from './postpublish-next-panel-template';

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

export function PostPublishNextPanel( {
	post,
	postType,
	isScheduled,
	link,
	focusOnMount,
} ) {
	const postLabel = postType?.labels?.singular_name;
	const viewPostLabel = postType?.labels?.view_item;
	const addNewPostLabel = postType?.labels?.add_new_item;
	const addLink = addQueryArgs( 'post-new.php', {
		post_type: post.type,
	} );

	if ( post.type === 'wp_template' ) {
		return (
			<PostPublishNextPanelTemplate
				post={ post }
				focusOnMount={ focusOnMount }
			/>
		);
	}

	return (
		<>
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
		</>
	);
}
