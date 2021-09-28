/**
 * WordPress dependencies
 */
import { link, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import Tooltip from '../tooltip';

export default function LinkedButton( { isLinked, ...props } ) {
	const label = isLinked ? __( 'Unlink Sides' ) : __( 'Link Sides' );

	return (
		<Tooltip text={ label }>
			<span>
				<Button
					{ ...props }
					className="component-box-control__linked-button"
					variant={ isLinked ? 'primary' : 'secondary' }
					isSmall
					icon={ isLinked ? link : linkOff }
					iconSize={ 16 }
					aria-label={ label }
				/>
			</span>
		</Tooltip>
	);
}
