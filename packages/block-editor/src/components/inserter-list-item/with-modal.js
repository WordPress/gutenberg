/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterListItem from './base';

export default function InserterListItemWithModal( {
	modalProps,
	children,
	...props
} ) {
	const [ isModalVisible, setIsModalVisible ] = useState( false );

	return (
		<>
			<InserterListItem
				{ ...props }
				onSelect={ () => setIsModalVisible( true ) }
				aria-haspopup="dialog"
				aria-expanded={ isModalVisible }
			/>
			{ isModalVisible && (
				<Modal
					{ ...modalProps }
					onRequestClose={ () => {
						setIsModalVisible( false );
					} }
				>
					{ children }
				</Modal>
			) }
		</>
	);
}
