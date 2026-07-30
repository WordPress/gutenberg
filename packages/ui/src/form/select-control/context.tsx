import { createContext, useContext } from '@wordpress/element';
import type { SelectTriggerProps } from '../primitives/select/types';

export const SelectControlSizeContext =
	createContext< SelectTriggerProps[ 'size' ] >( undefined );

export const useSelectControlSizeContext = () => {
	return useContext( SelectControlSizeContext );
};
