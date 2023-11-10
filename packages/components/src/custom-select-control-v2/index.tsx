/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { useCx } from '../utils/hooks/use-cx';
import * as Styled from './styles';
import type { CustomSelectProps, CustomSelectItemProps } from './types';

export function CustomSelect( props: CustomSelectProps ) {
	const {
		children,
		defaultValue,
		label,
		onChange,
		size = 'default',
		value,
		styledValue,
	} = props;

	const store = Ariakit.useSelectStore( {
		setValue: ( nextValue ) => onChange?.( nextValue ),
		defaultValue,
		value,
	} );

	const { value: currentValue } = store.useState();

	const cx = useCx();

	const classes = useMemo(
		() => cx( Styled.inputSize[ size ] ),
		[ cx, size ]
	);

	return (
		<>
			<Ariakit.SelectLabel store={ store }>{ label }</Ariakit.SelectLabel>
			<Styled.CustomSelectButton className={ classes } store={ store }>
				{ styledValue ? styledValue( currentValue ) : currentValue }
				<Ariakit.SelectArrow />
			</Styled.CustomSelectButton>
			<Styled.CustomSelectPopover store={ store } sameWidth>
				{ children }
			</Styled.CustomSelectPopover>
		</>
	);
}

export function CustomSelectItem( { ...props }: CustomSelectItemProps ) {
	return <Styled.CustomSelectItem { ...props } />;
}
