/**
 * External dependencies
 */
import { saveAs } from 'file-saver';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import getBaseThemeZip from './get-base-theme-zip';

export default function ThemeExporter( { ids, templatePartIds } ) {
	const files = useSelect(
		( select ) => {
			let loaded = true;
			const { getRawEntityRecord } = select( 'core' );
			const _files = [
				...ids.map( ( id ) => {
					const template = getRawEntityRecord( 'postType', 'wp_template', id );
					if ( ! template ) {
						loaded = false;
						return null;
					}
					return {
						fileName: `block-templates/${ template.slug }.html`,
						fileContent: template.content,
					};
				} ),
				...templatePartIds.map( ( id ) => {
					const templatePart = getRawEntityRecord(
						'postType',
						'wp_template_part',
						id
					);
					if ( ! templatePart ) {
						loaded = false;
						return null;
					}
					return {
						fileName: `block-template-parts/${ templatePart.slug }.html`,
						fileContent: templatePart.content,
					};
				} ),
			];
			return loaded && _files;
		},
		[ ids, templatePartIds ]
	);
	const exportTheme = useCallback( async () => {
		let zip = getBaseThemeZip();
		files.forEach( ( { fileName, fileContent } ) =>
			zip.file( fileName, fileContent )
		);
		zip = await zip.generateAsync( { type: 'blob' } );
		saveAs( zip, 'theme.zip' );
	}, [ files ] );
	return (
		<div className="edit-site-theme-exporter">
			<Button
				isPrimary
				aria-disabled={ ! files }
				disabled={ ! files }
				onClick={ files ? exportTheme : undefined }
			>
				{ __( 'Export Theme' ) }
			</Button>
		</div>
	);
}
