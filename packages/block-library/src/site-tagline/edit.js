/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	AlignmentControl,
	useBlockProps,
	BlockControls,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { SelectControl } from '@wordpress/components';

export default function SiteTaglineEdit( {
	attributes,
	setAttributes,
	insertBlocksAfter,
} ) {
	const { textAlign, tagName: TagName } = attributes;
	const { canUserEdit, tagline } = useSelect( ( select ) => {
		const { canUser, getEntityRecord, getEditedEntityRecord } =
			select( coreStore );
		const canEdit = canUser( 'update', 'settings' );
		const settings = canEdit ? getEditedEntityRecord( 'root', 'site' ) : {};
		const readOnlySettings = getEntityRecord( 'root', '__unstableBase' );

		return {
			canUserEdit: canUser( 'update', 'settings' ),
			tagline: canEdit
				? settings?.description
				: readOnlySettings?.description,
		};
	}, [] );

	const { editEntityRecord } = useDispatch( coreStore );

	function setTagline( newTagline ) {
		editEntityRecord( 'root', 'site', undefined, {
			description: newTagline,
		} );
	}

	const blockProps = useBlockProps( {
		className: classnames( {
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
			<InspectorControls group="advanced">
				<SelectControl
					label={ __( 'HTML element' ) }
					options={ [
						{ label: __( 'Default (<p>)' ), value: 'p' },
						{ label: '<h1>', value: 'h1' },
						{ label: '<h2>', value: 'h2' },
						{ label: '<h3>', value: 'h3' },
						{ label: '<h4>', value: 'h4' },
						{ label: '<h5>', value: 'h5' },
						{ label: '<h6>', value: 'h6' },
					] }
					value={ TagName }
					onChange={ ( newTagName ) =>
						setAttributes( { tagName: newTagName } )
					}
				/>
			</InspectorControls>
			<BlockControls group="block">
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
