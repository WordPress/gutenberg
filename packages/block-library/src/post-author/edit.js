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
	SelectControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { debounce } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	useDefaultAvatar,
	useToolsPanelDropdownMenuProps,
} from '../utils/hooks';

const AUTHORS_QUERY = {
	who: 'authors',
	per_page: 100,
	_fields: 'id,name',
	context: 'view',
};

function AuthorCombobox( { value, onChange } ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	const { authors, isLoading } = useSelect(
		( select ) => {
			const { getUsers, isResolving } = select( coreStore );

			const query = { ...AUTHORS_QUERY };
			if ( filterValue ) {
				query.search = filterValue;
				query.search_columns = [ 'name' ];
			}

			return {
				authors: getUsers( query ),
				isLoading: isResolving( 'getUsers', [ query ] ),
			};
		},
		[ filterValue ]
	);

	const authorOptions = useMemo( () => {
		const fetchedAuthors = ( authors ?? [] ).map( ( author ) => {
			return {
				value: author.id,
				label: decodeEntities( author.name ),
			};
		} );

		// Ensure the current author is included in the list.
		const foundAuthor = fetchedAuthors.findIndex(
			( fetchedAuthor ) => value?.id === fetchedAuthor.value
		);

		let currentAuthor = [];
		if ( foundAuthor < 0 && value ) {
			currentAuthor = [
				{
					value: value.id,
					label: decodeEntities( value.name ),
				},
			];
		} else if ( foundAuthor < 0 && ! value ) {
			currentAuthor = [
				{
					value: 0,
					label: __( '(No author)' ),
				},
			];
		}

		return [ ...currentAuthor, ...fetchedAuthors ];
	}, [ authors, value ] );

	return (
		<ComboboxControl
			__next40pxDefaultSize
			label={ __( 'Author' ) }
			options={ authorOptions }
			value={ value?.id }
			onFilterValueChange={ debounce( setFilterValue, 300 ) }
			onChange={ onChange }
			allowReset={ false }
			isLoading={ isLoading }
		/>
	);
}

function PostAuthorEdit( {
	isSelected,
	context: { postType, postId, queryId },
	attributes,
	setAttributes,
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const defaultAvatar = useDefaultAvatar();

	const { authorDetails, canAssignAuthor, supportsAuthor } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getUser, getPostType } =
				select( coreStore );
			const currentPost = getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
			const authorId = currentPost?.author;

			return {
				authorDetails: authorId
					? getUser( authorId, { context: 'view' } )
					: null,
				supportsAuthor:
					getPostType( postType )?.supports?.author ?? false,
				canAssignAuthor: currentPost?._links?.[
					'wp:action-assign-author'
				]
					? true
					: false,
			};
		},
		[ postType, postId ]
	);

	const { editEntityRecord } = useDispatch( coreStore );

	const {
		textAlign,
		showAvatar,
		showBio,
		byline,
		isLink,
		linkTarget,
		avatarSize,
	} = attributes;
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

	const handleSelect = ( nextAuthorId ) => {
		editEntityRecord( 'postType', postType, postId, {
			author: nextAuthorId,
		} );
	};

	const showAuthorControl =
		!! postId && ! isDescendentOfQueryLoop && canAssignAuthor;

	if ( ! supportsAuthor && postType !== undefined ) {
		return (
			<div { ...blockProps }>
				{ sprintf(
					// translators: %s: Name of the post type e.g: "post".
					__( 'This post type (%s) does not support the author.' ),
					postType
				) }
			</div>
		);
	}

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							avatarSize: 48,
							showAvatar: true,
							isLink: false,
							linkTarget: '_self',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					{ showAuthorControl && (
						<div style={ { gridColumn: '1 / -1' } }>
							<AuthorCombobox
								value={ authorDetails }
								onChange={ handleSelect }
							/>
						</div>
					) }
					<ToolsPanelItem
						label={ __( 'Show avatar' ) }
						isShownByDefault
						hasValue={ () => ! showAvatar }
						onDeselect={ () =>
							setAttributes( { showAvatar: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show avatar' ) }
							checked={ showAvatar }
							onChange={ () =>
								setAttributes( {
									showAvatar: ! showAvatar,
								} )
							}
						/>
					</ToolsPanelItem>
					{ showAvatar && (
						<ToolsPanelItem
							label={ __( 'Avatar size' ) }
							isShownByDefault
							hasValue={ () => avatarSize !== 48 }
							onDeselect={ () =>
								setAttributes( { avatarSize: 48 } )
							}
						>
							<SelectControl
								__next40pxDefaultSize
								label={ __( 'Avatar size' ) }
								value={ avatarSize }
								options={ avatarSizes }
								onChange={ ( size ) => {
									setAttributes( {
										avatarSize: Number( size ),
									} );
								} }
							/>
						</ToolsPanelItem>
					) }
					<ToolsPanelItem
						label={ __( 'Show bio' ) }
						isShownByDefault
						hasValue={ () => !! showBio }
						onDeselect={ () =>
							setAttributes( { showBio: undefined } )
						}
					>
						<ToggleControl
							label={ __( 'Show bio' ) }
							checked={ !! showBio }
							onChange={ () =>
								setAttributes( { showBio: ! showBio } )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Link author name to author page' ) }
						isShownByDefault
						hasValue={ () => !! isLink }
						onDeselect={ () => setAttributes( { isLink: false } ) }
					>
						<ToggleControl
							label={ __( 'Link author name to author page' ) }
							checked={ isLink }
							onChange={ () =>
								setAttributes( { isLink: ! isLink } )
							}
						/>
					</ToolsPanelItem>
					{ isLink && (
						<ToolsPanelItem
							label={ __( 'Link target' ) }
							isShownByDefault
							hasValue={ () => linkTarget !== '_self' }
							onDeselect={ () =>
								setAttributes( { linkTarget: '_self' } )
							}
						>
							<ToggleControl
								label={ __( 'Open in new tab' ) }
								onChange={ ( value ) =>
									setAttributes( {
										linkTarget: value ? '_blank' : '_self',
									} )
								}
								checked={ linkTarget === '_blank' }
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
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
				{ showAvatar && (
					<div className="wp-block-post-author__avatar">
						<img
							width={ avatarSize }
							src={
								authorDetails?.avatar_urls?.[ avatarSize ] ||
								defaultAvatar
							}
							alt={
								authorDetails?.name || __( 'Default Avatar' )
							}
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
