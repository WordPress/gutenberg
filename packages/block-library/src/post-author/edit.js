/**
 * External dependencies
 */
import { forEach } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function PostAuthorEdit( { isSelected, context, attributes, setAttributes } ) {
	const { postType, postId } = context;

	const { authorId, authorDetails, authors } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getUser, getAuthors } = select(
				'core'
			);
			const _authorId = getEditedEntityRecord(
				'postType',
				postType,
				postId
			)?.author;

			return {
				authorId: _authorId,
				authorDetails: _authorId ? getUser( _authorId ) : null,
				authors: getAuthors(),
			};
		},
		[ postType, postId ]
	);

	const { editEntityRecord } = useDispatch( 'core' );

	const { align, showAvatar, showBio, byline } = attributes;

	const avatarSizes = [];
	if ( authorDetails ) {
		forEach( authorDetails.avatar_urls, ( url, size ) => {
			avatarSizes.push( {
				value: size,
				label: `${ size } x ${ size }`,
			} );
		} );
	}

	const classNames = useMemo( () => {
		return {
			block: classnames( 'wp-block-post-author', {
				[ `has-text-align-${ align }` ]: align,
			} ),
		};
	}, [ align ] );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Author Settings' ) }>
					<SelectControl
						label={ __( 'Author' ) }
						value={ authorId }
						options={ authors.map( ( { id, name } ) => {
							return {
								value: id,
								label: name,
							};
						} ) }
						onChange={ ( nextAuthorId ) => {
							editEntityRecord( 'postType', postType, postId, {
								author: nextAuthorId,
							} );
						} }
					/>
					<ToggleControl
						label={ __( 'Show avatar' ) }
						checked={ showAvatar }
						onChange={ () =>
							setAttributes( { showAvatar: ! showAvatar } )
						}
					/>
					{ showAvatar && (
						<SelectControl
							label={ __( 'Avatar size' ) }
							value={ attributes.avatarSize }
							options={ avatarSizes }
							onChange={ ( size ) => {
								setAttributes( {
									avatarSize: Number( size ),
								} );
							} }
						/>
					) }
					<ToggleControl
						label={ __( 'Show bio' ) }
						checked={ showBio }
						onChange={ () =>
							setAttributes( { showBio: ! showBio } )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>
			</BlockControls>

			<div className={ classNames.block }>
				{ showAvatar && authorDetails && (
					<div className="wp-block-post-author__avatar">
						<img
							width={ attributes.avatarSize }
							src={
								authorDetails.avatar_urls[
									attributes.avatarSize
								]
							}
							alt={ authorDetails.name }
						/>
					</div>
				) }
				<div className="wp-block-post-author__content">
					{ ( ! RichText.isEmpty( byline ) || isSelected ) && (
						<RichText
							className="wp-block-post-author__byline"
							multiline={ false }
							placeholder={ __( 'Write byline …' ) }
							value={ byline }
							onChange={ ( value ) =>
								setAttributes( { byline: value } )
							}
						/>
					) }
					<p className="wp-block-post-author__name">
						{ authorDetails?.name }
					</p>
					{ showBio && (
						<p className="wp-block-post-author__bio">
							{ authorDetails?.description }
						</p>
					) }
				</div>
			</div>
		</>
	);
}

export default PostAuthorEdit;
