/**
 * WordPress dependencies
 */
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__experimentalText as Text,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GridItem from './grid-item';

const PAGE_SIZE = 100;

export default function Grid( { categoryId, items, ...props } ) {
	const composite = useCompositeState( { wrap: true } );
	const gridRef = useRef();

	if ( ! items?.length ) {
		return null;
	}

	const list = items.slice( 0, PAGE_SIZE );
	const restLength = items.length - PAGE_SIZE;

	return (
		<>
			<Composite
				{ ...composite }
				role="listbox"
				className="edit-site-patterns__grid"
				{ ...props }
				ref={ gridRef }
			>
				{ list.map( ( item ) => (
					<GridItem
						key={ item.name }
						item={ item }
						categoryId={ categoryId }
						{ ...composite }
					/>
				) ) }
			</Composite>
			{ restLength > 0 && (
				<Text variant="muted" as="p" align="center">
					{ sprintf(
						/* translators: %d: number of patterns */
						__( '+ %d more patterns' ),
						restLength
					) }
				</Text>
			) }
		</>
	);
}
