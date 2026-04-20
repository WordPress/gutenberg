/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { mediaEditKey } from '../../store/private-keys';

const messages = {
	crop: __( 'Image cropped.' ),
	rotate: __( 'Image rotated.' ),
	cropAndRotate: __( 'Image cropped and rotated.' ),
};

export default function useSaveImage( {
	crop,
	rotation,
	url,
	id,
	onSaveImage,
	onFinishEditing,
} ) {
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const [ isInProgress, setIsInProgress ] = useState( false );
	const { editMediaEntity } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return {
			editMediaEntity: settings?.[ mediaEditKey ],
		};
	}, [] );

	const cancel = useCallback( () => {
		setIsInProgress( false );
		onFinishEditing();
	}, [ onFinishEditing ] );

	const apply = useCallback( async () => {
		if ( ! editMediaEntity ) {
			onFinishEditing();
			createErrorNotice(
				__( 'Sorry, you are not allowed to edit images on this site.' ),
				{
					id: 'image-editing-error',
					type: 'snackbar',
				}
			);
			return;
		}

		setIsInProgress( true );

		const modifiers = [];

		if ( rotation > 0 ) {
			modifiers.push( {
				type: 'rotate',
				args: {
					angle: rotation,
				},
			} );
		}

		// The crop script may return some very small, sub-pixel values when the image was not cropped.
		// Crop only when the new size has changed by more than 0.1%.
		if ( crop.width < 99.9 || crop.height < 99.9 ) {
			modifiers.push( {
				type: 'crop',
				args: {
					left: crop.x,
					top: crop.y,
					width: crop.width,
					height: crop.height,
				},
			} );
		}

		if ( modifiers.length === 0 ) {
			// No changes to apply.
			setIsInProgress( false );
			onFinishEditing();
			return;
		}

		const modifierType =
			modifiers.length === 1 ? modifiers[ 0 ].type : 'cropAndRotate';

		try {
			const savedImage = await editMediaEntity(
				id,
				{
					src: url,
					modifiers,
				},
				{ throwOnError: true }
			);

			if ( savedImage ) {
				onSaveImage( {
					id: savedImage.id,
					url: savedImage.source_url,
				} );

				createSuccessNotice( messages[ modifierType ], {
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick: () => {
								onSaveImage( {
									id,
									url,
								} );
							},
						},
					],
				} );
			}
		} catch ( error ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: Error message. */
					__( 'Could not edit image. %s' ),
					stripHTML( error.message )
				),
				{
					id: 'image-editing-error',
					type: 'snackbar',
				}
			);
		} finally {
			setIsInProgress( false );
			onFinishEditing();
		}
	}, [
		crop,
		rotation,
		id,
		url,
		onSaveImage,
		createErrorNotice,
		createSuccessNotice,
		onFinishEditing,
		editMediaEntity,
	] );

	return useMemo(
		() => ( {
			isInProgress,
			apply,
			cancel,
		} ),
		[ isInProgress, apply, cancel ]
	);
}
