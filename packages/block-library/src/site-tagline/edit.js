/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import {
	AlignmentToolbar,
	useBlockProps,
	BlockControls,
	RichText,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function SiteTaglineEdit( { attributes, setAttributes } ) {
	const { textAlign } = attributes;
	const [ siteTagline, setSiteTagline ] = useEntityProp(
		'root',
		'site',
		'description'
	);
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );
	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					onChange={ ( newAlign ) =>
						setAttributes( { textAlign: newAlign } )
					}
					value={ textAlign }
				/>
			</BlockControls>

			<RichText
				allowedFormats={ [] }
				onChange={ setSiteTagline }
				placeholder={ __( 'Site Tagline' ) }
				tagName="p"
				value={ siteTagline }
				{ ...blockProps }
			/>
		</>
	);
}
