/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import {
	RichText,
	AlignmentToolbar,
	BlockControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';

export default function SiteTitleEdit( { attributes, setAttributes } ) {
	const { level, align } = attributes;
	const [ title, setTitle ] = useEntityProp( 'root', 'site', 'title' );
	const tagName = 0 === level ? 'p' : 'h' + level;

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>
			</BlockControls>

			<RichText
				tagName={ Block[ tagName ] }
				placeholder={ __( 'Site Title' ) }
				value={ title }
				onChange={ setTitle }
				className={ classnames( {
					[ `has-text-align-${ align }` ]: align,
				} ) }
				allowedFormats={ [] }
				disableLineBreaks
			/>
		</>
	);
}
