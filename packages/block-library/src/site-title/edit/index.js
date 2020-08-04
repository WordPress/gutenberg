/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { BlockControls, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LevelToolbar from './level-toolbar';

export default function SiteTitleEdit( {
	attributes: { level },
	setAttributes,
} ) {
	const [ title, setTitle ] = useEntityProp( 'root', 'site', 'title' );
	const tagName = level === 0 ? 'p' : `h${ level }`;
	return (
		<>
			<BlockControls>
				<LevelToolbar
					level={ level }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
			</BlockControls>
			<RichText
				tagName={ tagName }
				placeholder={ __( 'Site Title' ) }
				value={ title }
				onChange={ setTitle }
				allowedFormats={ [] }
			/>
		</>
	);
}
