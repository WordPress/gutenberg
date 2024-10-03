/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import {
	Modal,
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	ToggleControl,
	TextControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';

export default function InitPatternModal() {
	const { editPost } = useDispatch( editorStore );
	const [ syncType, setSyncType ] = useState( undefined );
	const [ title, setTitle ] = useState( '' );

	const { postType, isNewPost } = useSelect( ( select ) => {
		const { getEditedPostAttribute, isCleanNewPost } =
			select( editorStore );
		return {
			postType: getEditedPostAttribute( 'type' ),
			isNewPost: isCleanNewPost(),
		};
	}, [] );
	const [ isModalOpen, setIsModalOpen ] = useState( () =>
		isNewPost && postType === 'wp_block' ? true : false
	);

	if ( postType !== 'wp_block' || ! isNewPost ) {
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
						<VStack spacing="5">
							<TextControl
								label={ __( 'Name' ) }
								value={ title }
								onChange={ setTitle }
								placeholder={ __( 'My pattern' ) }
								className="patterns-create-modal__name-input"
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							<ToggleControl
								__nextHasNoMarginBottom
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
							<HStack justify="right">
								<Button
									// TODO: Switch to `true` (40px size) if possible
									__next40pxDefaultSize={ false }
									variant="primary"
									type="submit"
									disabled={ ! title }
									accessibleWhenDisabled
								>
									{ __( 'Create' ) }
								</Button>
							</HStack>
						</VStack>
					</form>
				</Modal>
			) }
		</>
	);
}
