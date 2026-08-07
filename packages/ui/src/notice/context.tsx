import { createContext, useContext } from '@wordpress/element';

type NoticeContextValue = {
	setTitle: ( title: string | undefined ) => void;
	setDescription: ( description: string | undefined ) => void;
};

const NoticeContext = createContext< NoticeContextValue >( {
	setTitle: () => {},
	setDescription: () => {},
} );

export function useNoticeContext() {
	return useContext( NoticeContext );
}

export { NoticeContext };
