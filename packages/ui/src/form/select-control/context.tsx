import { createContext, useContext } from '@wordpress/element';
import type { ItemPopupSize } from '../../utils/item-popup-size';

export const SelectControlSizeContext = createContext<
	ItemPopupSize | undefined
>( undefined );

export const useSelectControlSizeContext = () => {
	return useContext( SelectControlSizeContext );
};
