import * as Ariakit from '@ariakit/react';
import clsx from 'clsx';
import { createContext, useMemo } from '@wordpress/element';
import { VisuallyHidden } from '../visually-hidden';
import styles from './style.module.scss';
import type {
	CustomSelectContext as CustomSelectContextType,
	CustomSelectInternalProps,
} from './internal-types';
import InputBase from '../input-control/input-base';
import SelectControlChevronDown from '../select-control/chevron-down';
import BaseControl from '../base-control';

export const CustomSelectContext =
	createContext< CustomSelectContextType >( undefined );
CustomSelectContext.displayName = 'CustomSelectContext';

function CustomSelect( props: CustomSelectInternalProps ) {
	const {
		children,
		hideLabelFromVision = false,
		label,
		size = 'default',
		store,
		className,
		renderSelectedValue,
		...restProps
	} = props;

	const contextValue = useMemo( () => ( { store, size } ), [ store, size ] );

	return (
		<div className={ className }>
			<Ariakit.SelectLabel
				store={ store }
				render={
					hideLabelFromVision ? (
						// @ts-expect-error `children` are passed via the render prop
						<VisuallyHidden />
					) : (
						// @ts-expect-error `children` are passed via the render prop
						<BaseControl.VisualLabel as="div" />
					)
				}
			>
				{ label }
			</Ariakit.SelectLabel>
			<InputBase size={ size } suffix={ <SelectControlChevronDown /> }>
				<Ariakit.Select
					{ ...restProps }
					className={ clsx( styles.select, {
						[ styles[ 'is-small' ] ]: size === 'small',
					} ) }
					store={ store }
					// Move selection rather than open the popover, preserving legacy behavior.
					showOnKeyDown={ false }
				>
					{ renderSelectedValue() }
				</Ariakit.Select>
				<Ariakit.SelectPopover
					className={ styles.popover }
					gutter={ 12 }
					store={ store }
					sameWidth
					slide={ false }
					onKeyDown={ ( event ) => event.stopPropagation() }
					// Match legacy behavior
					flip={ false }
				>
					<CustomSelectContext.Provider value={ contextValue }>
						{ children }
					</CustomSelectContext.Provider>
				</Ariakit.SelectPopover>
			</InputBase>
		</div>
	);
}

export default CustomSelect;
