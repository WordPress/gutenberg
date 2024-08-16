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
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	ComboboxControl,
	PanelBody,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

const minimumUsersForCombobox = 25;

const AUTHORS_QUERY = {
	who: 'authors',
	per_page: 100,
};

function PostAuthorEdit( {
	isSelected,
	context: { postType, postId, queryId },
	attributes,
	setAttributes,
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const { authorId, authorDetails, authors } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getUser, getUsers } =
				select( coreStore );
			const _authorId = getEditedEntityRecord(
				'postType',
				postType,
				postId
			)?.author;

			return {
				authorId: _authorId,
				authorDetails: _authorId ? getUser( _authorId ) : null,
				authors: getUsers( AUTHORS_QUERY ),
			};
		},
		[ postType, postId ]
	);

	const { editEntityRecord } = useDispatch( coreStore );

	const { textAlign, showAvatar, showBio, byline, isLink, linkTarget } =
		attributes;
	const avatarSizes = [];
	const authorName = authorDetails?.name || __( 'Post Author' );
	if ( authorDetails?.avatar_urls ) {
		Object.keys( authorDetails.avatar_urls ).forEach( ( size ) => {
			avatarSizes.push( {
				value: size,
				label: `${ size } x ${ size }`,
			} );
		} );
	}

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const authorOptions = authors?.length
		? authors.map( ( { id, name } ) => {
				return {
					value: id,
					label: name,
				};
		  } )
		: [];

	const handleSelect = ( nextAuthorId ) => {
		editEntityRecord( 'postType', postType, postId, {
			author: nextAuthorId,
		} );
	};

	const showCombobox = authorOptions.length >= minimumUsersForCombobox;
	const showAuthorControl =
		!! postId && ! isDescendentOfQueryLoop && authorOptions.length > 0;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					{ showAuthorControl &&
						( ( showCombobox && (
							<ComboboxControl
								__nextHasNoMarginBottom
								label={ __( 'Author' ) }
								options={ authorOptions }
								value={ authorId }
								onChange={ handleSelect }
								allowReset={ false }
							/>
						) ) || (
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Author' ) }
								value={ authorId }
								options={ authorOptions }
								onChange={ handleSelect }
							/>
						) ) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show avatar' ) }
						checked={ showAvatar }
						onChange={ () =>
							setAttributes( { showAvatar: ! showAvatar } )
						}
					/>
					{ showAvatar && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
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
						__nextHasNoMarginBottom
						label={ __( 'Show bio' ) }
						checked={ showBio }
						onChange={ () =>
							setAttributes( { showBio: ! showBio } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Link author name to author page' ) }
						checked={ isLink }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
					/>
					{ isLink && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Open in new tab' ) }
							onChange={ ( value ) =>
								setAttributes( {
									linkTarget: value ? '_blank' : '_self',
								} )
							}
							checked={ linkTarget === '_blank' }
						/>
					) }
				</PanelBody>
			</InspectorControls>

			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>

			<div { ...blockProps }>
				{ showAvatar && authorDetails?.avatar_urls && (
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
							identifier="byline"
							className="wp-block-post-author__byline"
							aria-label={ __( 'Post author byline text' ) }
							placeholder={ __( 'Write byline…' ) }
							value={ byline }
							onChange={ ( value ) =>
								setAttributes( { byline: value } )
							}
						/>
					) }
					<p className="wp-block-post-author__name">
						{ isLink ? (
							<a
								href="#post-author-pseudo-link"
								onClick={ ( event ) => event.preventDefault() }
							>
								{ authorName }
							</a>
						) : (
							authorName
						) }
					</p>
					{ showBio && (
						<p
							className="wp-block-post-author__bio"
							dangerouslySetInnerHTML={ {
								__html: authorDetails?.description,
							} }
						/>
					) }
				</div>
			</div>
		</>
	);
}

export default PostAuthorEdit;
