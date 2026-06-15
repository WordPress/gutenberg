/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import {
	Modal,
	Button,
	ToggleControl,
	TextControl,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useState } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';

export default function InitPatternModal() {
	const { editPost } = useDispatch( editorStore );
	const [ syncType, setSyncType ] = useState( undefined );
	const [ title, setTitle ] = useState( '' );

	const isNewPost = useSelect(
		( select ) => select( editorStore ).isCleanNewPost(),
		[]
	);

	const [ isModalOpen, setIsModalOpen ] = useState( () => isNewPost );

	if ( ! isNewPost ) {
		return null;
	}

	return (
		<>
			{ isModalOpen && (
				<Modal
					title={ __( 'Create pattern' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
					} }
					overlayClassName="reusable-blocks-menu-items__convert-modal"
				>
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							setIsModalOpen( false );
							editPost( {
								title,
								meta: {
									wp_pattern_sync_status: syncType,
								},
							} );
						} }
					>
						<Stack direction="column" gap="lg">
							<TextControl
								label={ __( 'Name' ) }
								value={ title }
								onChange={ setTitle }
								placeholder={ __( 'My pattern' ) }
								className="patterns-create-modal__name-input"
								__next40pxDefaultSize
							/>
							<ToggleControl
								label={ _x( 'Synced', 'pattern (singular)' ) }
								help={ __(
									'Sync this pattern across multiple locations.'
								) }
								checked={ ! syncType }
								onChange={ () => {
									setSyncType(
										! syncType ? 'unsynced' : undefined
									);
								} }
							/>
							<Stack justify="right">
								<Button
									__next40pxDefaultSize
									variant="primary"
									type="submit"
									disabled={ ! title }
									accessibleWhenDisabled
								>
									{ __( 'Create' ) }
								</Button>
							</Stack>
						</Stack>
					</form>
				</Modal>
			) }
		</>
	);
}
