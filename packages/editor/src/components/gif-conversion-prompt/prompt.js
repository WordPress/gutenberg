/**
 * WordPress dependencies
 */
import { Button, Flex, FlexItem, Modal } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useRegistry } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as uploadStore } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Modal asking whether a single dropped animated GIF should be converted to a
 * video (the Video block's GIF variation) or kept as a GIF.
 *
 * Rendered by UploadPromptHost while a `gif-conversion` upload prompt is
 * pending — the prompt appears as soon as the file is identified as a
 * conversion candidate, before the upload finishes, so it reads as part of
 * the drop. The GIF uploads as a plain image in the background regardless;
 * the answer only decides whether a companion video is transcoded (and the
 * block later swapped by GifConversionBlockSwapper).
 *
 * @param {Object} props
 * @param {Object} props.prompt The upload prompt record ({ id, type, itemId }).
 */
export default function GifConversionPrompt( { prompt } ) {
	const registry = useRegistry();
	const convertButtonRef = useRef();

	// Steer towards converting: focus the primary button so Enter converts.
	useEffect( () => {
		convertButtonRef.current?.focus();
	}, [] );

	const resolve = ( decision ) => {
		const { resolveGifConversion, resolveUploadPrompt } = unlock(
			registry.dispatch( uploadStore )
		);
		// Act on the answer, then dismiss the prompt.
		resolveGifConversion( prompt.itemId, decision );
		resolveUploadPrompt( prompt.id );
	};

	return (
		<Modal
			title={ __( 'Convert to video' ) }
			// Closing the dialog keeps the GIF for this upload.
			onRequestClose={ () => resolve( 'gif' ) }
			size="small"
			focusOnMount={ false }
		>
			<Stack direction="column" gap="lg">
				<p>
					{ __(
						'This will save space without changing the visuals. The GIF stays in your media library.'
					) }
				</p>
				<Flex direction="row" justify="flex-end">
					<FlexItem>
						<Button
							variant="tertiary"
							__next40pxDefaultSize
							onClick={ () => resolve( 'gif' ) }
						>
							{ __( 'Not now' ) }
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							variant="primary"
							__next40pxDefaultSize
							ref={ convertButtonRef }
							onClick={ () => resolve( 'video' ) }
						>
							{ __( 'Convert' ) }
						</Button>
					</FlexItem>
				</Flex>
			</Stack>
		</Modal>
	);
}
