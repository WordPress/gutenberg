import { __experimentalGrid as Grid } from '@wordpress/components';
import { Icon } from '@wordpress/icons';
import { Button } from '@wordpress/ui';
import {
	ALL_ICONS_MANIFEST,
	availableIcons,
	nameToSlug,
	type Collection,
} from './manifest';

function filterIcons( filter: string, collection: Collection ) {
	const normalizedFilter = filter.toLowerCase();

	return Object.entries( availableIcons ).filter( ( [ name ] ) => {
		const iconInfo = ALL_ICONS_MANIFEST.get( nameToSlug( name ) );

		if (
			collection !== 'all' &&
			! iconInfo?.collections.includes( collection )
		) {
			return false;
		}

		if ( ! normalizedFilter.length ) {
			return true;
		}

		// Labels and keywords live in the manifest, so Storybook and the
		// icons registry search the same terms.
		return (
			name.toLowerCase().includes( normalizedFilter ) ||
			!! iconInfo?.label.toLowerCase().includes( normalizedFilter ) ||
			!! iconInfo?.keywords.some( ( keyword ) =>
				keyword.toLowerCase().includes( normalizedFilter )
			)
		);
	} );
}

export function IconGrid( {
	filter,
	collection,
	selectedName,
	onSelect,
}: {
	filter: string;
	collection: Collection;
	selectedName: string | null;
	onSelect: ( name: string ) => void;
} ) {
	const filteredIcons = filterIcons( filter, collection );

	if ( ! filteredIcons.length ) {
		return <p>No icons found.</p>;
	}

	return (
		<Grid templateColumns="repeat(auto-fill, minmax(100px, 1fr))">
			{ filteredIcons.map( ( [ name, icon ] ) => {
				const slug = nameToSlug( name );
				if ( ! ALL_ICONS_MANIFEST.has( slug ) ) {
					throw new Error(
						`Icon "${ name }" (slug: ${ slug }) is not found in the manifest. Add it to packages/icons/src/manifest.json.`
					);
				}
				const isSelected = name === selectedName;
				return (
					<Button
						key={ name }
						variant={ isSelected ? 'solid' : 'minimal' }
						tone={ isSelected ? 'brand' : 'neutral' }
						aria-pressed={ isSelected }
						onClick={ () => onSelect( name ) }
						style={ { flexDirection: 'column', padding: 8 } }
					>
						<Icon icon={ icon } size={ 32 } />
						<span
							style={ {
								fontSize: 12,
								fontWeight: 'normal',
								wordBreak: 'break-all',
							} }
						>
							{ name }
						</span>
					</Button>
				);
			} ) }
		</Grid>
	);
}
