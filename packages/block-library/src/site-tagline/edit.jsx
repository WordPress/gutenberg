import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import {
	useBlockProps,
	BlockControls,
	HeadingLevelDropdown,
	RichText,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

export default function SiteTaglineEdit( props ) {
	useDeprecatedTextAlign( props );

	const { attributes, setAttributes, insertBlocksAfter } = props;
	const { level, levelOptions } = attributes;
	const canUserEdit = useSelect(
		( select ) =>
			select( coreStore ).canUser( 'update', {
				kind: 'root',
				name: 'site',
			} ),
		[]
	);
	// Users who cannot edit the site settings cannot read them either, so the
	// tagline comes from the base entity instead.
	const [ tagline, setTagline ] = useEntityProp(
		'root',
		canUserEdit ? 'site' : '__unstableBase',
		'description',
		undefined,
		{ coalesceEdits: true }
	);

	const TagName = level === 0 ? 'p' : `h${ level }`;
	const blockProps = useBlockProps( {
		className:
			! canUserEdit && ! tagline && 'wp-block-site-tagline__placeholder',
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
			__unstableOnSplitAtEnd={
				insertBlocksAfter
					? () =>
							insertBlocksAfter(
								createBlock( getDefaultBlockName() )
							)
					: undefined
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
			</BlockControls>
			{ siteTaglineContent }
		</>
	);
}
