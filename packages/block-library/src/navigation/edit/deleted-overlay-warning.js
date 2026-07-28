/**
 * WordPress dependencies
 */
import { Notice, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Warning displayed when a selected overlay template part has been deleted.
 *
 * @param {Object}   props            Component props.
 * @param {Function} props.onClear    Callback to clear the overlay selection.
 * @param {Function} props.onCreate   Callback to create a new overlay.
 * @param {boolean}  props.isCreating Whether a new overlay is being created.
 * @return {React.JSX.Element} The deleted overlay warning component.
 */
function DeletedOverlayWarning( { onClear, onCreate, isCreating = false } ) {
	const message = createInterpolateElement(
		__(
			'The selected overlay template part is missing or has been deleted. <clearButton>Reset to default overlay</clearButton> or <createButton>create a new overlay</createButton>.'
		),
		{
			clearButton: (
				<Button
					__next40pxDefaultSize
					onClick={ onClear }
					variant="link"
					disabled={ isCreating }
					accessibleWhenDisabled
				/>
			),
			createButton: (
				<Button
					__next40pxDefaultSize
					onClick={ onCreate }
					variant="link"
					disabled={ isCreating }
					accessibleWhenDisabled
					isBusy={ isCreating }
				/>
			),
		}
	);

	return (
		<Notice
			status="warning"
			isDismissible={ false }
			className="wp-block-navigation__deleted-overlay-warning"
		>
			{ message }
		</Notice>
	);
}

export default DeletedOverlayWarning;
