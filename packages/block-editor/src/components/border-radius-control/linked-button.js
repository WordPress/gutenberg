/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { link, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function LinkedButton( { isLinked, ...props } ) {
	const label = isLinked ? __( 'Unlink radii' ) : __( 'Link radii' );

	return (
		<Button
			{ ...props }
			className="component-border-radius-control__linked-button"
			size="small"
			icon={ isLinked ? link : linkOff }
			iconSize={ 24 }
			label={ label }
		/>
	);
}
