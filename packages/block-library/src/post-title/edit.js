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
	InspectorControls,
	useBlockProps,
	PlainText,
} from '@wordpress/block-editor';
import { ToggleControl, TextControl, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityProp } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from '../heading/heading-level-dropdown';
import { useCanEditEntity } from '../utils/hooks';

export default function PostTitleEdit( {
	attributes: { level, textAlign, isLink, rel, linkTarget },
	setAttributes,
	context: { postType, postId, queryId },
} ) {
	const TagName = 0 === level ? 'p' : 'h' + level;
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const userCanEdit = useCanEditEntity( 'postType', postType, postId );
	const [ rawTitle = '', setTitle, fullTitle ] = useEntityProp(
		'postType',
		postType,
		'title',
		postId
	);
	const [ link ] = useEntityProp( 'postType', postType, 'link', postId );
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	let titleElement = (
		<TagName { ...blockProps }>{ __( 'Post Title' ) }</TagName>
	);

	if ( postType && postId ) {
		titleElement =
			userCanEdit && ! isDescendentOfQueryLoop ? (
				<PlainText
					tagName={ TagName }
					placeholder={ __( 'No Title' ) }
					value={ rawTitle }
					onChange={ setTitle }
					__experimentalVersion={ 2 }
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
		titleElement =
			userCanEdit && ! isDescendentOfQueryLoop ? (
				<TagName { ...blockProps }>
					<PlainText
						tagName="a"
						href={ link }
						target={ linkTarget }
						rel={ rel }
						placeholder={
							! rawTitle.length ? __( 'No Title' ) : null
						}
						value={ rawTitle }
						onChange={ setTitle }
						__experimentalVersion={ 2 }
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
			<BlockControls group="block">
				<HeadingLevelDropdown
					selectedLevel={ level }
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
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Make title a link' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
					{ isLink && (
						<>
							<ToggleControl
								label={ __( 'Open in new tab' ) }
								onChange={ ( value ) =>
									setAttributes( {
										linkTarget: value ? '_blank' : '_self',
									} )
								}
								checked={ linkTarget === '_blank' }
							/>
							<TextControl
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
			{ titleElement }
		</>
	);
}
