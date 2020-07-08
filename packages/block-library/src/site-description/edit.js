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

export default function SiteDescriptionEdit( { attributes, setAttributes } ) {
	const { align } = attributes;
	const [ description, setDescription ] = useEntityProp(
		'root',
		'site',
		'description'
	);

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					onChange={ ( newAlign ) =>
						setAttributes( { align: newAlign } )
					}
					value={ align }
				/>
			</BlockControls>

			<RichText
				allowedFormats={ [] }
				className={ classnames( {
					[ `has-text-align-${ align }` ]: align,
				} ) }
				onChange={ setDescription }
				placeholder={ __( 'Site Description' ) }
				tagName={ Block.p }
				value={ description }
			/>
		</>
	);
}
