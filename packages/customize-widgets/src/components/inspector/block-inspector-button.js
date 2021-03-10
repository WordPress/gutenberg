/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { speak } from '@wordpress/a11y';

function BlockInspectorButton( {
	isInspectorOpened = false,
	onToggle = noop,
	small = false,
	...props
} ) {
	const speakMessage = () => {
		if ( isInspectorOpened ) {
			speak( __( 'Block settings closed' ) );
		} else {
			speak(
				__(
					'Additional settings are now available in the Editor block settings sidebar'
				)
			);
		}
	};

	const label = isInspectorOpened
		? __( 'Hide more settings' )
		: __( 'Show more settings' );

	return (
		<MenuItem
			onClick={ () => {
				onToggle( isInspectorOpened );
				speakMessage();
			} }
			{ ...props }
		>
			{ ! small && label }
		</MenuItem>
	);
}

export default BlockInspectorButton;
