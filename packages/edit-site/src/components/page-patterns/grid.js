/**
 * WordPress dependencies
 */
import { __experimentalText as Text } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GridItem from './grid-item';

const PAGE_SIZE = 100;

export default function Grid( { categoryId, items, ...props } ) {
	const gridRef = useRef();

	if ( ! items?.length ) {
		return null;
	}

	const list = items.slice( 0, PAGE_SIZE );
	const restLength = items.length - PAGE_SIZE;

	return (
		<>
			<ul
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
					/>
				) ) }
			</ul>
			{ restLength > 0 && (
				<Text variant="muted" as="p" align="center">
					{ sprintf(
						/* translators: %d: number of patterns */
						__( '+ %d more patterns discoverable by searching' ),
						restLength
					) }
				</Text>
			) }
		</>
	);
}
