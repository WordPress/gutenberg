/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigationContext } from '../context';
import { useNavigationMenuContext } from '../menu/context';

export const useNavigationTreeItem = ( props ) => {
	const {
		navigationTree: { addItem, removeItem },
	} = useNavigationContext();
	const { menu } = useNavigationMenuContext();

	const key = props.item;
	useEffect( () => {
		addItem( key, { ...props, menu } );

		return () => {
			removeItem( key );
		};
	}, [] );
};
