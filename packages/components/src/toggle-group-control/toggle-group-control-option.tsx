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
import type {
	ToggleGroupControlOptionProps,
	ToggleGroupControlContextProps,
} from './types';
import { useToggleGroupControlContext } from './toggle-group-control-context';

function getShowSeparator(
	toggleGroupControlContext: ToggleGroupControlContextProps,
	index: number
) {
	const { currentId, items, state } = toggleGroupControlContext;
	if ( items.length < 3 ) {
		return false;
	}
	const targetNodeExists =
		items.find( ( { id } ) => id === currentId )?.ref?.current?.dataset
			?.value === state;
	const isLast = index === items.length - 1;
	// If no target node exists, don't show the separator after the last item.
	if ( ! targetNodeExists ) {
		return ! isLast;
	}
	const isActive = items[ index ]?.id === currentId;
	const isNextActive = items[ index + 1 ]?.id === currentId;
	return ! ( isActive || isNextActive || isLast );
}

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
	const index = toggleGroupControlContext.items.findIndex(
		( item ) => item.id === buttonProps.id
	);
	const showSeparator = getShowSeparator( toggleGroupControlContext, index );
	return (
		<ToggleGroupControlButton
			ref={ forwardedRef }
			{ ...{
				...toggleGroupControlContext,
				...buttonProps,
				showSeparator,
			} }
		/>
	);
}
export default contextConnect(
	ToggleGroupControlOption,
	'ToggleGroupControlOption'
);
