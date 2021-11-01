/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Context } from './context';

export default function useAsyncMode() {
	return useContext( Context );
}
