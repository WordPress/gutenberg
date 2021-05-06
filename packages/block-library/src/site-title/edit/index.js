/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
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
	const [ title, setTitle ] = useEntityProp( 'root', 'site', 'title' );
	const { canUserEdit, readOnlyTitle } = useSelect( ( select ) => {
		const { canUser, getEntityRecord } = select( coreStore );
		const siteData = getEntityRecord( 'root', '__unstableBase' );
		return {
			canUserEdit: canUser( 'update', 'settings' ),
			readOnlyTitle: siteData?.name,
		};
	}, [] );
	const TagName = level === 0 ? 'p' : `h${ level }`;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
			'wp-block-site-title__placeholder':
				! canUserEdit && ! readOnlyTitle,
		} ),
	} );
	const siteTitleContent = canUserEdit ? (
		<TagName { ...blockProps }>
			<RichText
				tagName={ isLink ? 'a' : 'div' }
				aria-label={ __( 'Site title text' ) }
				placeholder={ __( 'Write site title…' ) }
				value={ title || readOnlyTitle }
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
					{ readOnlyTitle || __( 'Site Title placeholder' ) }
				</a>
			) : (
				<div style={ { display: 'inline-block' } }>
					{ title || readOnlyTitle }
				</div>
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
						</>
					) }
				</PanelBody>
			</InspectorControls>
			{ siteTitleContent }
		</>
	);
}
