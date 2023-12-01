/**
 * WordPress dependencies
 */
import { __experimentalHeading as Heading } from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Link from '../routes/link';

export default function ViewList( {
	view,
	fields,
	data,
	getItemId,
	onClickPreviewField,
} ) {
	const shownData = useAsyncList( data, { step: 3 } );
	const previewField = fields.find(
		( field ) => field.id === view.layout.previewField
	);
	return (
		<ul>
			{ shownData.map( ( item, index ) => {
				return (
					<li key={ getItemId?.( item ) || index }>
						<Heading as="h3" level={ 5 }>
							<Link
								params={ {
									postId: item.id,
									postType: item.type,
									canvas: 'edit',
								} }
								onClick={ ( event ) => {
									event.preventDefault();
									onClickPreviewField( item );
								} }
							>
								{ previewField.getValue( { item } ) }
							</Link>
						</Heading>
					</li>
				);
			} ) }
		</ul>
	);
}
