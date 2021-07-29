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
	PolymorphicComponentProps,
} from '../ui/context';
import SegmentedControlButton from './segmented-control-button';
import type {
	SegmentedControlOptionProps,
	SegmentedControlContextProps,
} from './types';
import { useSegmentedControlContext } from './segmented-control-context';

function getShowSeparator(
	segmentedControlContext: SegmentedControlContextProps,
	index: number
) {
	const { currentId, items } = segmentedControlContext;
	const isLast = index === items.length - 1;
	const isActive = items[ index ]?.id === currentId;
	const isNextActive = items[ index + 1 ]?.id === currentId;

	let showSeparator = true;

	if ( items.length < 3 ) {
		showSeparator = false;
	}

	if ( isActive || isNextActive || isLast ) {
		showSeparator = false;
	}

	return showSeparator;
}

function SegmentedControlOption(
	props: PolymorphicComponentProps< SegmentedControlOptionProps, 'input' >,
	forwardedRef: import('react').Ref< any >
) {
	const segmentedControlContext = useSegmentedControlContext();
	const id = useInstanceId(
		SegmentedControlOption,
		segmentedControlContext.baseId || 'segmented-control-option'
	);
	const buttonProps = useContextSystem(
		{ ...props, id },
		'SegmentedControlOption'
	);
	const index = segmentedControlContext.items.findIndex(
		( item ) => item.id === buttonProps.id
	);
	const showSeparator = getShowSeparator( segmentedControlContext, index );
	return (
		<SegmentedControlButton
			ref={ forwardedRef }
			{ ...{ ...segmentedControlContext, ...buttonProps, showSeparator } }
		/>
	);
}
export default contextConnect(
	SegmentedControlOption,
	'SegmentedControlOption'
);
