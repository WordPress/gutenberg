/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
	PlainText,
	InspectorControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useEntityProp } from '@wordpress/core-data';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

export default function Edit( {
	attributes: {
		textAlign,
		singleCommentLabel,
		multipleCommentsLabel,
		showSingleCommentLabel,
		showPostTitle,
	},
	setAttributes,
	context: { postType, postId },
} ) {
	const [ commentsCount, setCommentsCount ] = useState();

	const [ rawTitle ] = useEntityProp( 'postType', postType, 'title', postId );

	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	useEffect( () => {
		if ( ! postId ) {
			setCommentsCount( 0 );
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
		</BlockControls>
	);

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				<ToggleControl
					label={ __( 'Show post title' ) }
					checked={ showPostTitle }
					onChange={ ( value ) =>
						setAttributes( { showPostTitle: value } )
					}
				/>
				{ ! postId && (
					<ToggleControl
						label={ __( 'Show single comment' ) }
						help={ __(
							'Toggles between single comments and multiple comments reply sentence'
						) }
						checked={ showSingleCommentLabel }
						onChange={ ( value ) =>
							setAttributes( { showSingleCommentLabel: value } )
						}
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);

	const postTitle = postId ? `“${ rawTitle }”` : 'Post Title';

	const singlePlaceholder = showPostTitle
		? __( 'One response to ' )
		: __( 'One response' );

	const multiplePlaceholder = showPostTitle
		? __( ' Responses to ' )
		: __( ' Responses' );

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<h3 { ...blockProps }>
				{ showSingleCommentLabel || commentsCount === 1 ? (
					<>
						<PlainText
							__experimentalVersion={ 2 }
							tagName="span"
							aria-label={ singlePlaceholder }
							placeholder={ singlePlaceholder }
							value={ singleCommentLabel }
							onChange={ ( newLabel ) =>
								setAttributes( {
									singleCommentLabel: newLabel,
								} )
							}
						/>
						{ showPostTitle ? postTitle : null }
					</>
				) : (
					<>
						{ commentsCount }
						<PlainText
							__experimentalVersion={ 2 }
							tagName="span"
							aria-label={ multiplePlaceholder }
							placeholder={ multiplePlaceholder }
							value={ multipleCommentsLabel }
							onChange={ ( newLabel ) =>
								setAttributes( {
									multipleCommentsLabel: newLabel,
								} )
							}
						/>
						{ showPostTitle ? postTitle : null }
					</>
				) }
			</h3>
		</>
	);
}
