import { memo, useMemo } from '@wordpress/element';
import { Icon } from '@wordpress/icons';
import { Button } from '@wordpress/ui';
import {
	ALL_ICONS_MANIFEST,
	availableIcons,
	nameToSlug,
	type Collection,
	type IconComponent,
} from './manifest';
import styles from './library.module.scss';

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

// Memoized so selecting an icon only re-renders the tiles whose state changed.
const IconTile = memo( function Tile( {
	name,
	icon,
	isSelected,
	onSelect,
}: {
	name: string;
	icon: IconComponent;
	isSelected: boolean;
	onSelect: ( name: string ) => void;
} ) {
	return (
		<Button
			variant={ isSelected ? 'solid' : 'minimal' }
			tone={ isSelected ? 'brand' : 'neutral' }
			aria-pressed={ isSelected }
			onClick={ () => onSelect( name ) }
			className={ styles[ 'icon-button' ] }
		>
			<Icon icon={ icon } size={ 32 } />
			<span className={ styles[ 'icon-name' ] }>{ name }</span>
		</Button>
	);
} );

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
	const filteredIcons = useMemo(
		() => filterIcons( filter, collection ),
		[ filter, collection ]
	);

	if ( ! filteredIcons.length ) {
		return <p>No icons found.</p>;
	}

	return (
		<div className={ styles[ 'icon-grid' ] }>
			{ filteredIcons.map( ( [ name, icon ] ) => {
				const slug = nameToSlug( name );
				if ( ! ALL_ICONS_MANIFEST.has( slug ) ) {
					throw new Error(
						`Icon "${ name }" (slug: ${ slug }) is not found in the manifest. Add it to packages/icons/src/manifest.json.`
					);
				}
				return (
					<IconTile
						key={ name }
						name={ name }
						icon={ icon }
						isSelected={ name === selectedName }
						onSelect={ onSelect }
					/>
				);
			} ) }
		</div>
	);
}
