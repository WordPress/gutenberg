import { useContext } from '@wordpress/element';
import { Context } from './context';

export default function useAsyncMode(): boolean {
	return useContext( Context );
}
