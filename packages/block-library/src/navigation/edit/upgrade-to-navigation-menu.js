/**
 * WordPress dependencies
 */
import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	Warning,
} from '@wordpress/block-editor';
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

export default function UpgradeToNavigationMenu( {
	blockProps,
	blocks,
	onUpgrade,
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
			<Warning
				actions={ [
					<Button
						key="upgrade"
						onClick={ () => setIsModalVisible( true ) }
						variant="primary"
					>
						{ __( 'Upgrade' ) }
					</Button>,
				] }
			>
				{ __(
					'The navigation block has been updated to store data in a similar way to a reusable block. Please use the upgrade option to save your navigation block data and continue editing your block.'
				) }
			</Warning>
			<Disabled>
				<nav { ...blockProps }>
					<div { ...innerBlocksProps } />
				</nav>
			</Disabled>
			{ isModalVisible && (
				<NavigationMenuNameModal
					title={ __( 'Name your navigation menu' ) }
					onRequestClose={ () => {
						setIsModalVisible( false );
					} }
					onFinish={ async ( title ) => {
						const menu = await createNavigationMenu( title );
						onUpgrade( menu );
					} }
				/>
			) }
		</>
	);
}
