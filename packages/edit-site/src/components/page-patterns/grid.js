/**
 * WordPress dependencies
 */
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	FlexBlock,
	Button,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GridItem from './grid-item';

const PAGE_SIZE = 100;

const isEven = ( _, index ) => index % 2 === 0;
const isOdd = ( _, index ) => index % 2 !== 0;

export default function Grid( { categoryId, items } ) {
	const composite = useCompositeState( { orientation: 'vertical' } );
	const isSmallerViewport = useViewportMatch( 'large', '<' );
	const [ page, setPage ] = useState( 1 );
	const gridRef = useRef();

	if ( ! items?.length ) {
		return null;
	}

	const maxCount = page * PAGE_SIZE;
	const list = items.slice( 0, maxCount );

	return (
		<>
			<Composite
				{ ...composite }
				role="listbox"
				className="edit-site-patterns__grid"
				ref={ gridRef }
			>
				{ isSmallerViewport ? (
					<FlexBlock>
						{ list.map( ( item ) => (
							<GridItem
								key={ item.name }
								item={ item }
								categoryId={ categoryId }
								composite={ composite }
							/>
						) ) }
					</FlexBlock>
				) : (
					<>
						<FlexBlock>
							{ list.filter( isEven ).map( ( item ) => (
								<GridItem
									key={ item.name }
									item={ item }
									categoryId={ categoryId }
									composite={ composite }
								/>
							) ) }
						</FlexBlock>
						<FlexBlock>
							{ list.filter( isOdd ).map( ( item ) => (
								<GridItem
									key={ item.name }
									item={ item }
									categoryId={ categoryId }
									composite={ composite }
								/>
							) ) }
						</FlexBlock>
					</>
				) }
			</Composite>
			{ items.length >= maxCount && (
				<Button
					variant="primary"
					onClick={ () => setPage( ( prevPage ) => prevPage + 1 ) }
				>
					{ __( 'Load more' ) }
				</Button>
			) }
		</>
	);
}
