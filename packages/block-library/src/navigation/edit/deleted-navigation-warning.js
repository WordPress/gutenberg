/**
 * WordPress dependencies
 */
import { Warning } from '@wordpress/block-editor';
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

function DeletedNavigationWarning( { onCreateNew, isNotice = false } ) {
	const message = createInterpolateElement(
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
	);

	return isNotice ? (
		<Notice status="warning" isDismissible={ false }>
			{ message }
		</Notice>
	) : (
		<Warning>{ message }</Warning>
	);
}

export default DeletedNavigationWarning;
