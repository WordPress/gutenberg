/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, PolymorphicComponentProps } from '../ui/context';
import { useSlider } from './hook';
import type { Props } from './types';
import { View } from '../view';

const Slider = (
	props: PolymorphicComponentProps< Props, 'input', false >,
	forwardedRef: Ref< any >
) => {
	return <View { ...useSlider( props ) } as="input" ref={ forwardedRef } />;
};

const ConnectedSlider = contextConnect( Slider, 'Slider' );

export default ConnectedSlider;
