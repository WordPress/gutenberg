/**
 * WordPress dependencies
 */
import {
	createContext,
	useState,
	useContext,
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { PostPickerParams, PostPickerState } from './types';

interface PostPickerContextType {
	state: PostPickerState;
	openPostPicker: ( params: PostPickerParams ) => void;
	closePostPicker: () => void;
}

const PostPickerContext = createContext< PostPickerContextType | undefined >(
	undefined
);

export function PostPickerProvider( {
	children,
}: {
	children: JSX.Element | JSX.Element[];
} ) {
	const [ state, setState ] = useState< PostPickerState >( {
		isOpen: false,
		postType: 'page',
		onSelect: () => {},
		excludePostId: undefined,
		title: undefined,
	} );

	const openPostPicker = useCallback( ( params: PostPickerParams ) => {
		setState( {
			...params,
			isOpen: true,
		} );
	}, [] );

	const closePostPicker = useCallback( () => {
		setState( ( prevState ) => ( {
			...prevState,
			isOpen: false,
		} ) );
	}, [] );

	return (
		<PostPickerContext.Provider
			value={ { state, openPostPicker, closePostPicker } }
		>
			{ children }
		</PostPickerContext.Provider>
	);
}

export function usePostPickerContext() {
	const context = useContext( PostPickerContext );
	if ( ! context ) {
		throw new Error(
			'usePostPickerContext must be used within a PostPickerProvider'
		);
	}
	return context;
}
