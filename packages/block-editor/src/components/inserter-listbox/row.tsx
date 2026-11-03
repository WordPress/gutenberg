import { forwardRef } from '@wordpress/element';
import { Composite } from '@wordpress/components';
import type {
	ForwardedRef,
	ForwardRefExoticComponent,
	RefAttributes,
} from 'react';
import type { InserterListboxRowProps } from './types';

function InserterListboxRow(
	props: InserterListboxRowProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	return <Composite.Group role="presentation" ref={ ref } { ...props } />;
}

// Names the props type so the emitted declaration stays portable.
export default forwardRef( InserterListboxRow ) as ForwardRefExoticComponent<
	InserterListboxRowProps & RefAttributes< HTMLDivElement >
>;
