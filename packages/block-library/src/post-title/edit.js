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
	useBlockProps,
	PlainText,
	HeadingLevelDropdown,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { ToggleControl, TextControl, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function PostTitleEdit( {
	attributes: { level, levelOptions, textAlign, isLink, rel, linkTarget },
	setAttributes,
	context: { postType, postId, queryId },
	insertBlocksAfter,
} ) {
	const TagName = level === 0 ? 'p' : `h${ level }`;
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const userCanEdit = useSelect(
		( select ) => {
			/**
			 * useCanEditEntity may trigger an OPTIONS request to the REST API
			 * via the canUser resolver. However, when the Post Title is a
			 * descendant of a Query Loop block, the title cannot be edited. In
			 * order to avoid these unnecessary requests, we call the hook
			 * without the proper data, resulting in returning early without
			 * making them.
			 */
			if ( isDescendentOfQueryLoop ) {
				return false;
			}
			return select( coreStore ).canUser( 'update', {
				kind: 'postType',
				name: postType,
				id: postId,
			} );
		},
		[ isDescendentOfQueryLoop, postType, postId ]
	);
	const [ rawTitle = '', setTitle, fullTitle ] = useEntityProp(
		'postType',
		postType,
		'title',
		postId
	);
	const [ link ] = useEntityProp( 'postType', postType, 'link', postId );
	const onSplitAtEnd = () => {
		insertBlocksAfter( createBlock( getDefaultBlockName() ) );
	};
	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );
	const blockEditingMode = useBlockEditingMode();

	let titleElement = <TagName { ...blockProps }>{ __( 'Title' ) }</TagName>;

	if ( postType && postId ) {
		titleElement = userCanEdit ? (
			<PlainText
				tagName={ TagName }
				placeholder={ __( 'No title' ) }
				value={ rawTitle }
				onChange={ setTitle }
				__experimentalVersion={ 2 }
				__unstableOnSplitAtEnd={ onSplitAtEnd }
				{ ...blockProps }
			/>
		) : (
			<TagName
				{ ...blockProps }
				dangerouslySetInnerHTML={ { __html: fullTitle?.rendered } }
			/>
		);
	}

	if ( isLink && postType && postId ) {
		titleElement = userCanEdit ? (
			<TagName { ...blockProps }>
				<PlainText
					tagName="a"
					href={ link }
					target={ linkTarget }
					rel={ rel }
					placeholder={ ! rawTitle.length ? __( 'No title' ) : null }
					value={ rawTitle }
					onChange={ setTitle }
					__experimentalVersion={ 2 }
					__unstableOnSplitAtEnd={ onSplitAtEnd }
				/>
			</TagName>
		) : (
			<TagName { ...blockProps }>
				<a
					href={ link }
					target={ linkTarget }
					rel={ rel }
					onClick={ ( event ) => event.preventDefault() }
					dangerouslySetInnerHTML={ {
						__html: fullTitle?.rendered,
					} }
				/>
			</TagName>
		);
	}

	return (
		<>
			{ blockEditingMode === 'default' && (
				<>
					<BlockControls group="block">
						<HeadingLevelDropdown
							value={ level }
							options={ levelOptions }
							onChange={ ( newLevel ) =>
								setAttributes( { level: newLevel } )
							}
						/>
						<AlignmentControl
							value={ textAlign }
							onChange={ ( nextAlign ) => {
								setAttributes( { textAlign: nextAlign } );
							} }
						/>
					</BlockControls>
					<InspectorControls>
						<PanelBody title={ __( 'Settings' ) }>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Make title a link' ) }
								onChange={ () =>
									setAttributes( { isLink: ! isLink } )
								}
								checked={ isLink }
							/>
							{ isLink && (
								<>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __( 'Open in new tab' ) }
										onChange={ ( value ) =>
											setAttributes( {
												linkTarget: value
													? '_blank'
													: '_self',
											} )
										}
										checked={ linkTarget === '_blank' }
									/>
									<TextControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Link rel' ) }
										value={ rel }
										onChange={ ( newRel ) =>
											setAttributes( { rel: newRel } )
										}
									/>
								</>
							) }
						</PanelBody>
					</InspectorControls>
				</>
			) }
			{ titleElement }
		</>
	);
}
