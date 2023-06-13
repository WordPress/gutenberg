/**
 * WordPress dependencies
 */
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import GridItem from './grid-item';

export default function Grid( { categoryId, label, icon, items } ) {
	const composite = useCompositeState( { orientation: 'vertical' } );

	if ( ! items?.length ) {
		return null;
	}

	return (
		<Composite
			{ ...composite }
			role="listbox"
			className="edit-site-library__grid"
			aria-label={ label }
		>
			{ items.map( ( item ) => (
				<GridItem
					key={ item.name }
					icon={ icon }
					item={ item }
					categoryId={ categoryId }
					composite={ composite }
				/>
			) ) }
		</Composite>
	);
}
