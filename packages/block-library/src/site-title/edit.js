/**
 * WordPress dependencies
 */
import {
	useEditEntity,
	RichText,
	useEditedEntityAttribute,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { EntityHandlers } from '@wordpress/editor';
import { Placeholder, Spinner } from '@wordpress/components';

function TitleInput() {
	const editEntity = useEditEntity();
	return (
		<RichText
			value={ useEditedEntityAttribute( 'title' ) }
			onChange={ ( title ) =>
				editEntity( {
					title,
				} )
			}
			tagName="h1"
			placeholder={ __( 'Site Title' ) }
			formattingControls={ [] }
		/>
	);
}

export default function SiteTitleEdit() {
	const entity = useSelect(
		( select ) => select( 'core' ).getEntityRecord( 'root', 'site' ),
		[]
	);
	return entity ? (
		<EntityHandlers entity={ entity } handles={ { title: true } } noInnerBlocks>
			<TitleInput />
		</EntityHandlers>
	) : (
		<Placeholder>
			<Spinner />
		</Placeholder>
	);
}
