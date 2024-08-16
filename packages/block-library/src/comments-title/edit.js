/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
	InspectorControls,
	store as blockEditorStore,
	HeadingLevelDropdown,
} from '@wordpress/block-editor';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEntityProp } from '@wordpress/core-data';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

export default function Edit( {
	attributes: {
		textAlign,
		showPostTitle,
		showCommentsCount,
		level,
		levelOptions,
	},
	setAttributes,
	context: { postType, postId },
} ) {
	const TagName = 'h' + level;
	const [ commentsCount, setCommentsCount ] = useState();
	const [ rawTitle ] = useEntityProp( 'postType', postType, 'title', postId );
	const isSiteEditor = typeof postId === 'undefined';
	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const {
		threadCommentsDepth,
		threadComments,
		commentsPerPage,
		pageComments,
	} = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().__experimentalDiscussionSettings;
	} );

	useEffect( () => {
		if ( isSiteEditor ) {
			// Match the number of comments that will be shown in the comment-template/edit.js placeholder

			const nestedCommentsNumber = threadComments
				? Math.min( threadCommentsDepth, 3 ) - 1
				: 0;
			const topLevelCommentsNumber = pageComments ? commentsPerPage : 3;

			const commentsNumber =
				parseInt( nestedCommentsNumber ) +
				parseInt( topLevelCommentsNumber );

			setCommentsCount( Math.min( commentsNumber, 3 ) );
			return;
		}
		const currentPostId = postId;
		apiFetch( {
			path: addQueryArgs( '/wp/v2/comments', {
				post: postId,
				_fields: 'id',
			} ),
			method: 'HEAD',
			parse: false,
		} )
			.then( ( res ) => {
				// Stale requests will have the `currentPostId` of an older closure.
				if ( currentPostId === postId ) {
					setCommentsCount(
						parseInt( res.headers.get( 'X-WP-Total' ) )
					);
				}
			} )
			.catch( () => {
				setCommentsCount( 0 );
			} );
	}, [ postId ] );

	const blockControls = (
		<BlockControls group="block">
			<AlignmentControl
				value={ textAlign }
				onChange={ ( newAlign ) =>
					setAttributes( { textAlign: newAlign } )
				}
			/>
			<HeadingLevelDropdown
				value={ level }
				options={ levelOptions }
				onChange={ ( newLevel ) =>
					setAttributes( { level: newLevel } )
				}
			/>
		</BlockControls>
	);

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Show post title' ) }
					checked={ showPostTitle }
					onChange={ ( value ) =>
						setAttributes( { showPostTitle: value } )
					}
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Show comments count' ) }
					checked={ showCommentsCount }
					onChange={ ( value ) =>
						setAttributes( { showCommentsCount: value } )
					}
				/>
			</PanelBody>
		</InspectorControls>
	);

	const postTitle = isSiteEditor ? __( '“Post Title”' ) : `"${ rawTitle }"`;

	let placeholder;
	if ( showCommentsCount && commentsCount !== undefined ) {
		if ( showPostTitle ) {
			if ( commentsCount === 1 ) {
				/* translators: %s: Post title. */
				placeholder = sprintf( __( 'One response to %s' ), postTitle );
			} else {
				placeholder = sprintf(
					/* translators: 1: Number of comments, 2: Post title. */
					_n(
						'%1$s response to %2$s',
						'%1$s responses to %2$s',
						commentsCount
					),
					commentsCount,
					postTitle
				);
			}
		} else if ( commentsCount === 1 ) {
			placeholder = __( 'One response' );
		} else {
			placeholder = sprintf(
				/* translators: %s: Number of comments. */
				_n( '%s response', '%s responses', commentsCount ),
				commentsCount
			);
		}
	} else if ( showPostTitle ) {
		if ( commentsCount === 1 ) {
			/* translators: %s: Post title. */
			placeholder = sprintf( __( 'Response to %s' ), postTitle );
		} else {
			/* translators: %s: Post title. */
			placeholder = sprintf( __( 'Responses to %s' ), postTitle );
		}
	} else if ( commentsCount === 1 ) {
		placeholder = __( 'Response' );
	} else {
		placeholder = __( 'Responses' );
	}

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<TagName { ...blockProps }>{ placeholder }</TagName>
		</>
	);
}
