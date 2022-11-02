/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import {
	RichText,
	AlignmentControl,
	InspectorControls,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import LevelControl from './level-toolbar';

export default function SiteTitleEdit( {
	attributes,
	setAttributes,
	insertBlocksAfter,
} ) {
	const { level, textAlign, isLink, linkTarget } = attributes;
	const { canUserEdit, title } = useSelect( ( select ) => {
		const { canUser, getEntityRecord, getEditedEntityRecord } =
			select( coreStore );
		const canEdit = canUser( 'update', 'settings' );
		const settings = canEdit ? getEditedEntityRecord( 'root', 'site' ) : {};
		const readOnlySettings = getEntityRecord( 'root', '__unstableBase' );

		return {
			canUserEdit: canEdit,
			title: canEdit ? settings?.title : readOnlySettings?.name,
		};
	}, [] );
	const { editEntityRecord } = useDispatch( coreStore );

	function setTitle( newTitle ) {
		editEntityRecord( 'root', 'site', undefined, {
			title: newTitle,
		} );
	}

	const TagName = level === 0 ? 'p' : `h${ level }`;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
			'wp-block-site-title__placeholder': ! canUserEdit && ! title,
		} ),
	} );
	const siteTitleContent = canUserEdit ? (
		<TagName { ...blockProps }>
			<RichText
				tagName={ isLink ? 'a' : 'span' }
				href={ isLink ? '#site-title-pseudo-link' : undefined }
				aria-label={ __( 'Site title text' ) }
				placeholder={ __( 'Write site title…' ) }
				value={ title }
				onChange={ setTitle }
				allowedFormats={ [] }
				disableLineBreaks
				__unstableOnSplitAtEnd={ () =>
					insertBlocksAfter( createBlock( getDefaultBlockName() ) )
				}
			/>
		</TagName>
	) : (
		<TagName { ...blockProps }>
			{ isLink ? (
				<a
					href="#site-title-pseudo-link"
					onClick={ ( event ) => event.preventDefault() }
				>
					{ decodeEntities( title ) ||
						__( 'Site Title placeholder' ) }
				</a>
			) : (
				<span>
					{ decodeEntities( title ) ||
						__( 'Site Title placeholder' ) }
				</span>
			) }
		</TagName>
	);
	return (
		<>
			<BlockControls group="block">
				<LevelControl
					level={ level }
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
						label={ __( 'Make title link to home' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
					{ isLink && (
						<ToggleControl
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
			{ siteTitleContent }
		</>
	);
}
