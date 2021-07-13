/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	PolymorphicComponentProps,
} from '../ui/context';
import Button from './segmented-control-button';
import type { SegmentedControlOption } from './types';
import RadioContext from './radio-context';

function getShowSeparator( radio: any, index: number ) {
	const { currentId, items } = radio;
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
	const radio = useContext( RadioContext );
	const buttonProps = useContextSystem( props, 'SegmentedControlOption' );
	const index = radio.items.findIndex(
		( item: any ) => item.id === buttonProps.id
	);
	const showSeparator = getShowSeparator( radio, index );
	return (
		<Button
			ref={ forwardedRef }
			{ ...{ ...radio, ...buttonProps, showSeparator } }
		/>
	);
}
export default contextConnect( ControlOption, 'SegmentedControlOption' );
