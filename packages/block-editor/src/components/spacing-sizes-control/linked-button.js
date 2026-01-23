/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { link, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function LinkedButton( { isLinked, ...props } ) {
	const label = isLinked ? __( 'Unlink sides' ) : __( 'Link sides' );

	return (
		<Button
			{ ...props }
			size="small"
			icon={ isLinked ? link : linkOff }
			iconSize={ 24 }
			label={ label }
		/>
	);
}
