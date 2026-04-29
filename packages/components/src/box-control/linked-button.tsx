/**
 * WordPress dependencies
 */
import { link, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';

export default function LinkedButton( {
	isLinked,
	...props
}: { isLinked?: boolean } & React.ComponentProps< typeof Button > ) {
	const label = isLinked ? __( 'Unlink sides' ) : __( 'Link sides' );

	return (
		<Button
			{ ...props }
			className="component-box-control__linked-button"
			size="small"
			icon={ isLinked ? link : linkOff }
			iconSize={ 24 }
			label={ label }
		/>
	);
}
