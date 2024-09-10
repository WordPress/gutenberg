/**
 * WordPress dependencies
 */
import { Button, Tooltip } from '@wordpress/components';
import { link, linkOff } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

export default function LinkedButton( { isLinked, ...props } ) {
	const label = isLinked
		? sprintf(
				// translators: 1. Type of spacing being modified (Padding, margin, etc).
				__( 'Unlink %1$s' ),
				props.label
		  ).trim()
		: sprintf(
				// translators: 1. Type of spacing being modified (Padding, margin, etc).
				__( 'Link %1$s' ),
				props.label
		  ).trim();

	return (
		<Tooltip text={ label }>
			<Button
				{ ...props }
				className="spacing-sizes-control__linked-button"
				size="small"
				icon={ isLinked ? link : linkOff }
				iconSize={ 24 }
				aria-label={ label }
			/>
		</Tooltip>
	);
}
