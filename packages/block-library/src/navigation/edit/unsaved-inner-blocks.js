/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, Warning } from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';
import { Button, Disabled } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationMenuNameModal from './navigation-menu-name-modal';

export default function UnsavedInnerBlocks( {
	blockProps,
	blocks,
	onSave,
	isSelected,
} ) {
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: false,
	} );
	const [ isModalVisible, setIsModalVisible ] = useState( false );

	const { saveEntityRecord } = useDispatch( coreStore );

	const createNavigationMenu = useCallback(
		async ( title = __( 'Untitled Navigation Menu' ) ) => {
			const record = {
				title,
				content: serialize( blocks ),
				status: 'publish',
			};

			const navigationMenu = await saveEntityRecord(
				'postType',
				'wp_navigation',
				record
			);

			return navigationMenu;
		},
		[ blocks, serialize, saveEntityRecord ]
	);

	return (
		<>
			<nav { ...blockProps }>
				{ isSelected && (
					<Warning
						className="wp-block-navigation__unsaved-changes-warning"
						actions={ [
							<Button
								key="save"
								onClick={ () => setIsModalVisible( true ) }
								variant="primary"
							>
								{ __( 'Save as' ) }
							</Button>,
						] }
					>
						{ __( 'Save this block to continue editing.' ) }
					</Warning>
				) }
				<Disabled>
					<div { ...innerBlocksProps } />
				</Disabled>
			</nav>
			{ isModalVisible && (
				<NavigationMenuNameModal
					title={ __( 'Name your navigation menu' ) }
					onRequestClose={ () => {
						setIsModalVisible( false );
					} }
					onFinish={ async ( title ) => {
						const menu = await createNavigationMenu( title );
						onSave( menu );
					} }
				/>
			) }
		</>
	);
}
