/**
 * WordPress dependencies
 */
import { Warning } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

function DeletedNavigationWarning( { onCreateNew } ) {
	return (
		<Warning>
			{ createInterpolateElement(
				__(
					'Navigation Menu has been deleted or is unavailable. <button>Create a new menu?</button>'
				),
				{
					button: <Button onClick={ onCreateNew } variant="link" />,
				}
			) }
		</Warning>
	);
}

export default DeletedNavigationWarning;
