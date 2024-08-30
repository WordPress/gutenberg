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
					'Navigation Menu has been deleted or is unavailable. <button>Create a new Menu?</button>'
				),
				{
					button: (
						<Button
							// TODO: Switch to `true` (40px size) if possible
							__next40pxDefaultSize={ false }
							onClick={ onCreateNew }
							variant="link"
						/>
					),
				}
			) }
		</Warning>
	);
}

export default DeletedNavigationWarning;
