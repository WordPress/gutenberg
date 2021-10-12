/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../ui/context';
import ToggleGroupControlButton from './toggle-group-control-button';
import type { ToggleGroupControlOptionProps } from './types';
import { useToggleGroupControlContext } from './toggle-group-control-context';

function ToggleGroupControlOption(
	props: WordPressComponentProps< ToggleGroupControlOptionProps, 'input' >,
	forwardedRef: import('react').Ref< any >
) {
	const toggleGroupControlContext = useToggleGroupControlContext();
	const id = useInstanceId(
		ToggleGroupControlOption,
		toggleGroupControlContext.baseId || 'toggle-group-control-option'
	);
	const buttonProps = useContextSystem(
		{ ...props, id },
		'ToggleGroupControlOption'
	);
	return (
		<ToggleGroupControlButton
			ref={ forwardedRef }
			{ ...{
				...toggleGroupControlContext,
				...buttonProps,
			} }
		/>
	);
}
export default contextConnect(
	ToggleGroupControlOption,
	'ToggleGroupControlOption'
);
