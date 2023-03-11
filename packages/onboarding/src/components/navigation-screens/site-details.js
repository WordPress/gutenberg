/**
 * WordPress dependencies
 */
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export default function SiteDetails() {
	const { editEntityRecord } = useDispatch( coreStore );
	const title = useSelect( ( select ) => {
		const { getEditedEntityRecord } = select( coreStore );
		return getEditedEntityRecord( 'root', 'site' )?.title;
	}, [] );
	return (
		<div>
			<h1>Site details content</h1>
			<TextControl
				label={ __( 'Site Title' ) }
				value={ title || '' }
				onChange={ ( newTitle ) => {
					editEntityRecord( 'root', 'site', undefined, {
						title: newTitle,
					} );
				} }
			/>
		</div>
	);
}
