/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	AlignmentControl,
	useBlockProps,
	BlockControls,
	HeadingLevelDropdown,
	RichText,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

export default function SiteTaglineEdit( {
	attributes,
	setAttributes,
	insertBlocksAfter,
} ) {
	const { textAlign, level, levelOptions } = attributes;
	const { canUserEdit, tagline } = useSelect( ( select ) => {
		const { canUser, getEntityRecord, getEditedEntityRecord } =
			select( coreStore );
		const canEdit = canUser( 'update', {
			kind: 'root',
			name: 'site',
		} );
		const settings = canEdit ? getEditedEntityRecord( 'root', 'site' ) : {};
		const readOnlySettings = getEntityRecord( 'root', '__unstableBase' );

		return {
			canUserEdit: canEdit,
			tagline: canEdit
				? settings?.description
				: readOnlySettings?.description,
		};
	}, [] );

	const TagName = level === 0 ? 'p' : `h${ level }`;
	const { editEntityRecord } = useDispatch( coreStore );

	function setTagline( newTagline ) {
		editEntityRecord( 'root', 'site', undefined, {
			description: newTagline,
		} );
	}

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
			'wp-block-site-tagline__placeholder': ! canUserEdit && ! tagline,
		} ),
	} );
	const siteTaglineContent = canUserEdit ? (
		<RichText
			allowedFormats={ [] }
			onChange={ setTagline }
			aria-label={ __( 'Site tagline text' ) }
			placeholder={ __( 'Write site tagline…' ) }
			tagName={ TagName }
			value={ tagline }
			disableLineBreaks
			__unstableOnSplitAtEnd={ () =>
				insertBlocksAfter( createBlock( getDefaultBlockName() ) )
			}
			{ ...blockProps }
		/>
	) : (
		<TagName { ...blockProps }>
			{ tagline || __( 'Site Tagline placeholder' ) }
		</TagName>
	);
	return (
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
					onChange={ ( newAlign ) =>
						setAttributes( { textAlign: newAlign } )
					}
					value={ textAlign }
				/>
			</BlockControls>
			{ siteTaglineContent }
		</>
	);
}
