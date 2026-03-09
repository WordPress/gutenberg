import { createContext } from '@wordpress/element';

export const TitleTextContext = createContext<
	| {
			setTitleText: ( text: string | undefined ) => void;
	  }
	| undefined
>( undefined );
