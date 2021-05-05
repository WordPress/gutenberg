/**
 * WordPress dependencies
 */
import { Button, Tooltip } from '@wordpress/components';
import { link, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function LinkedButton( { isLinked, ...props } ) {
	const label = isLinked ? __( 'Unlink Radii' ) : __( 'Link Radii' );

	return (
		<Tooltip text={ label }>
			<span>
				<Button
					{ ...props }
					className="component-border-radius-control__linked-button"
					isPrimary={ isLinked }
					isSecondary={ ! isLinked }
					isSmall
					icon={ isLinked ? link : linkOff }
					iconSize={ 16 }
					aria-label={ label }
				/>
			</span>
		</Tooltip>
	);
}
