/**
 * WordPress dependencies
 */
import { EntityProvider, useEntityProp } from '@wordpress/core-data';
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { Placeholder, Spinner } from '@wordpress/components';

function TitleInput() {
	const [ title, setTitle ] = useEntityProp( 'site', 'title' );
	return (
		<RichText
			value={ title }
			onChange={ setTitle }
			tagName="h1"
			placeholder={ __( 'Site Title' ) }
			formattingControls={ [] }
		/>
	);
}

export default function SiteTitleEdit() {
	const site = useSelect(
		( select ) => select( 'core' ).getEntityRecord( 'root', 'site' ),
		[]
	);
	return site ? (
		<EntityProvider type="site">
			<TitleInput />
		</EntityProvider>
	) : (
		<Placeholder>
			<Spinner />
		</Placeholder>
	);
}
