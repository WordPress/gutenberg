/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import {
	AlignmentToolbar,
	BlockControls,
	RichText,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function SiteDescriptionEdit( {
	attributes: { align },
	setAttributes,
} ) {
	const [ description, setDescription ] = useEntityProp(
		'root',
		'site',
		'description'
	);
	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( newAlign ) =>
						setAttributes( { align: newAlign } )
					}
				/>
			</BlockControls>
			<RichText
				tagName="p"
				placeholder={ __( 'Site Description' ) }
				value={ description }
				onChange={ setDescription }
				allowedFormats={ [] }
			/>
		</>
	);
}
