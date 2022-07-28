/**
 * WordPress dependencies
 */
import { link, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { Button, Tooltip } from '@wordpress/components';

export default function LinkedButton( { isLinked, onClick } ) {
	const label = isLinked ? __( 'Unlink Sides' ) : __( 'Link Sides' );

	return (
		<Tooltip text={ label }>
			<span className="component-spacing-sizes-control__linked-button">
				<Button
					variant={ isLinked ? 'primary' : 'secondary' }
					isSmall
					icon={ isLinked ? link : linkOff }
					iconSize={ 16 }
					aria-label={ label }
					onClick={ onClick }
				/>
			</span>
		</Tooltip>
	);
}
