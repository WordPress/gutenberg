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
	__experimentalBlock as Block,
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
				className={ classnames( {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
				onChange={ setSiteTagline }
				placeholder={ __( 'Site Tagline' ) }
				tagName={ Block.p }
				value={ siteTagline }
			/>
		</>
	);
}
