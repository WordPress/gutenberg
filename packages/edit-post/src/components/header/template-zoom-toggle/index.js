/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { stack } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

function TemplateZoomToggle( { ...props } ) {
	const isActive = useSelect(
		( select ) =>
			select( 'core/edit-post' ).isFeatureActive( 'templateZoomOut' ),
		[]
	);
	const { toggleFeature } = useDispatch( 'core/edit-post' );

	return (
		<Button
			isPressed={ isActive }
			onClick={ () => {
				toggleFeature( 'templateZoomOut' );
			} }
			icon={ stack }
			/* translators: button label text should, if possible, be under 16
characters. */
			label={
				isActive
					? __( 'Zoom in to the post content' )
					: __( 'Zoom out to the template' )
			}
			{ ...props }
		/>
	);
}

export default TemplateZoomToggle;
