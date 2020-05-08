/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { cleanForSlug } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { Modal, TextControl, Button } from '@wordpress/components';

export default function AddTemplate( {
	ids,
	onAddTemplateId,
	onRequestClose,
	isOpen,
} ) {
	const slugs = useSelect(
		( select ) => {
			const { getEntityRecord } = select( 'core' );
			return ids.reduce( ( acc, id ) => {
				const template = getEntityRecord(
					'postType',
					'wp_template',
					id
				);
				acc[ template ? template.slug : 'loading' ] = true;
				return acc;
			}, {} );
		},
		[ ids ]
	);
	const { saveEntityRecord } = useDispatch( 'core' );

	const [ slug, _setSlug ] = useState( '' );
	const [ help, setHelp ] = useState();
	const setSlug = useCallback(
		( nextSlug ) => {
			_setSlug( nextSlug );
			const cleanSlug = cleanForSlug( nextSlug );
			setHelp(
				slugs[ cleanSlug ]
					? __( 'Template already exists, edit it instead.' )
					: cleanSlug
			);
		},
		[ slugs ]
	);
	const add = useCallback( async () => {
		_setSlug( '' );
		const cleanSlug = cleanForSlug( slug );

		try {
			const template = await saveEntityRecord(
				'postType',
				'wp_template',
				{
					title: cleanSlug,
					status: 'publish',
					slug: cleanSlug,
				}
			);
			onAddTemplateId( template.id );
			onRequestClose();
		} catch ( err ) {
			setHelp( __( 'Error adding template.' ) );
		}
	}, [ slug, onRequestClose ] );
	return (
		! slugs.loading &&
		isOpen && (
			<Modal
				title={ __( 'Add Template' ) }
				onRequestClose={ onRequestClose }
			>
				<TextControl
					label={ __( 'Add Template' ) }
					placeholder={ __( 'template-slug' ) }
					value={ slug }
					onChange={ setSlug }
					help={ help }
				/>
				<Button
					isPrimary
					disabled={ ! slug || slugs[ cleanForSlug( slug ) ] }
					onClick={ add }
				>
					{ __( 'Add' ) }
				</Button>
			</Modal>
		)
	);
}
