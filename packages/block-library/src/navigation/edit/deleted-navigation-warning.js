/**
 * WordPress dependencies
 */
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement, useState } from '@wordpress/element';

function DeletedNavigationNotice( { onCreateNew } ) {
	const [ noticeVisible, setNoticeVisible ] = useState( true );

	return (
		noticeVisible && (
			<Notice
				status="warning"
				onRemove={ () => setNoticeVisible( false ) }
				isDismissible
			>
				{ createInterpolateElement(
					__(
						'Navigation Menu has been deleted or is unavailable. <button>Create a new Menu?</button>'
					),
					{
						button: (
							<Button
								__next40pxDefaultSize
								onClick={ onCreateNew }
								variant="link"
							/>
						),
					}
				) }
			</Notice>
		)
	);
}

export default DeletedNavigationNotice;
