import { createContext, useContext } from '@wordpress/element';

export type ItemLayoutContextValue = {
	labelId?: string;
	descriptionId: string;
};

const ItemLayoutContext = createContext< ItemLayoutContextValue | null >(
	null
);

const useItemLayoutContext = () => useContext( ItemLayoutContext );

export { ItemLayoutContext, useItemLayoutContext };
