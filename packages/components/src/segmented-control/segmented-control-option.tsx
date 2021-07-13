/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	PolymorphicComponentProps,
} from '../ui/context';
import Button from './segmented-control-button';
import type {
	SegmentedControlOption,
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

function ControlOption(
	props: PolymorphicComponentProps< SegmentedControlOption, 'input' >,
	forwardedRef: import('react').Ref< any >
) {
	const segmentedControlContext = useSegmentedControlContext();
	const buttonProps = useContextSystem( props, 'SegmentedControlOption' );
	const index = segmentedControlContext.items.findIndex(
		( item: any ) => item.id === buttonProps.id
	);
	const showSeparator = getShowSeparator( segmentedControlContext, index );
	return (
		<Button
			ref={ forwardedRef }
			{ ...{ ...segmentedControlContext, ...buttonProps, showSeparator } }
		/>
	);
}
export default contextConnect( ControlOption, 'SegmentedControlOption' );
