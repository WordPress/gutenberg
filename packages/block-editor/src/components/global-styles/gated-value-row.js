import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';

/**
 * Shown in place of a control whose editor setting is disabled while the
 * block still carries a value: the value stays visible and removable, but
 * cannot be edited. Settings gate controls, not rendering, so without this
 * row a value applied before the restriction (or carried in by pasted or
 * imported content, or a theme switch) could never be removed.
 *
 * @param {Object}   props
 * @param {string}   props.value   Display form of the applied value.
 * @param {Function} props.onReset Removes the value.
 *
 * @return {Element} The row.
 */
export default function GatedValueRow( { value, onReset } ) {
	return (
		<Stack direction="row" justify="space-between" align="center" gap="sm">
			<Text
				style={ {
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
				} }
			>
				<code>{ value }</code>
			</Text>
			<Button
				size="compact"
				variant="secondary"
				onClick={ onReset }
				accessibleWhenDisabled
			>
				{ __( 'Reset' ) }
			</Button>
		</Stack>
	);
}
