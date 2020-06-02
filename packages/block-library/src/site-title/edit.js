/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import {
	PlainText,
	AlignmentToolbar,
	BlockControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';

export default function SiteTitleEdit( { attributes, setAttributes } ) {
	const { align } = attributes;
	const [ title, setTitle ] = useEntityProp( 'root', 'site', 'title' );

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

			<PlainText
				__experimentalVersion={ 2 }
				tagName={ Block.h1 }
				placeholder={ __( 'Site Title' ) }
				value={ title }
				onChange={ setTitle }
				disableLineBreaks
			/>
		</>
	);
}
