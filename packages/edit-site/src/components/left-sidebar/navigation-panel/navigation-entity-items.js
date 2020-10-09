/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __experimentalNavigationItem as NavigationItem } from '@wordpress/components';

const defaultKeyExtractor = ( { kind, name, entity } ) =>
	`${ kind }-${ name }-${ entity.id }`;

export default function NavigationEntityItems( {
	kind,
	name,
	query = {},

	getKey = defaultKeyExtractor,
	renderItem,
} ) {
	const entities = useSelect(
		( select ) => {
			const { getEntityRecords } = select( 'core' );
			return getEntityRecords( kind, name, query );
		},
		[ kind, name, query ]
	);

	if ( ! entities ) {
		return null;
	}

	return entities.map( ( entity ) => {
		const key = getKey( { kind, name, query, entity } );

		return (
			<Fragment key={ key }>
				{ renderItem( {
					ItemComponent: NavigationItem,
					entity,
					item: key,
					props: {
						item: key,
					},
				} ) }
			</Fragment>
		);
	} );
}
