/**
 * WordPress dependencies
 */
import { Button, Tooltip } from '@wordpress/components';
import { link, linkOff } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

export default function LinkedButton( { isLinked, ...props } ) {
	const label = isLinked
		? sprintf(
				// translators: 1. Type of spacing being modified (padding, margin, etc).
				__( 'Unlink %1$s' ),
				props.label.toLowerCase()
		  ).trim()
		: sprintf(
				// translators: 1. Type of spacing being modified (padding, margin, etc).
				__( 'Link %1$s' ),
				props.label.toLowerCase()
		  ).trim();

	return (
		<Tooltip text={ label }>
			<Button
				{ ...props }
				size="small"
				icon={ isLinked ? link : linkOff }
				iconSize={ 24 }
				aria-label={ label }
			/>
		</Tooltip>
	);
}
