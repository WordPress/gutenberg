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
import {
	PanelBody,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from '../heading/heading-level-dropdown';

export default function Edit( {
	attributes: {
		textAlign,
		singleCommentLabel,
		multipleCommentsLabel,
		showPostTitle,
		showCommentsCount,
		level,
	},
	setAttributes,
	context: { postType, postId },
} ) {
	const TagName = 'h' + level;
	const [ commentsCount, setCommentsCount ] = useState();
	const [ editingMode, setEditingMode ] = useState( 'plural' );
	const [ rawTitle ] = useEntityProp( 'postType', postType, 'title', postId );
	const isSiteEditor = typeof postId === 'undefined';
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	useEffect( () => {
		if ( isSiteEditor ) {
			setCommentsCount( 3 );
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
				selectedLevel={ level }
				onChange={ ( newLevel ) =>
					setAttributes( { level: newLevel } )
				}
			/>
		</BlockControls>
	);

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				{ isSiteEditor && (
					<ToggleGroupControl
						label={ __( 'Editing mode' ) }
						onChange={ setEditingMode }
						value={ editingMode }
					>
						<ToggleGroupControlOption
							label={ __( 'Singular' ) }
							value="singular"
						/>
						<ToggleGroupControlOption
							label={ __( 'Plural' ) }
							value="plural"
						/>
					</ToggleGroupControl>
				) }
				<ToggleControl
					label={ __( 'Show post title' ) }
					checked={ showPostTitle }
					onChange={ ( value ) =>
						setAttributes( { showPostTitle: value } )
					}
				/>
				<ToggleControl
					label={ __( 'Show comments count' ) }
					checked={ showCommentsCount }
					onChange={ ( value ) =>
						setAttributes( { showCommentsCount: value } )
					}
				/>
			</PanelBody>
		</InspectorControls>
	);

	const postTitle = isSiteEditor ? __( '"Post Title"' ) : `"${ rawTitle }"`;

	const singlePlaceholder = showPostTitle
		? __( 'One response to ' )
		: __( 'One response' );

	const multiplePlaceholder = showPostTitle
		? __( 'Responses to ' )
		: __( 'Responses' );

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<TagName { ...blockProps }>
				{ editingMode === 'singular' || commentsCount === 1 ? (
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
						{ showCommentsCount ? commentsCount : null }
						<PlainText
							__experimentalVersion={ 2 }
							tagName="span"
							aria-label={
								showCommentsCount
									? ` ${ multiplePlaceholder }`
									: multiplePlaceholder
							}
							placeholder={
								showCommentsCount
									? ` ${ multiplePlaceholder }`
									: multiplePlaceholder
							}
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
			</TagName>
		</>
	);
}
