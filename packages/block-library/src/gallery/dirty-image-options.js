/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

export default ( { applyImageOptions, cancelImageOptions } ) => (
	<div className={ 'gallery-settings-buttons' }>
		<Button isPrimary onClick={ applyImageOptions }>
			{ __( 'Apply to all images' ) }
		</Button>
		<Button
			className={ 'cancel-apply-to-images' }
			isLink
			onClick={ cancelImageOptions }
		>
			{ __( 'Cancel' ) }
		</Button>
	</div>
);
