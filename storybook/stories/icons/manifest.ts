import * as iconsPackage from '@wordpress/icons';
import manifest from '../../../packages/icons/src/manifest.json';

const { Icon, ...availableIcons } = iconsPackage;

export { availableIcons };

export type IconComponent =
	( typeof availableIcons )[ keyof typeof availableIcons ];

export const ALL_ICONS_MANIFEST = new Map(
	manifest.map(
		( entry: {
			slug: string;
			label: string;
			collections?: string[];
			keywords?: string[];
		} ) => [
			entry.slug,
			{
				slug: entry.slug,
				label: entry.label,
				collections: entry.collections ?? [],
				keywords: entry.keywords ?? [],
			},
		]
	)
);

export const COLLECTIONS = [
	{ value: 'all', label: '@wordpress/icons' },
	{ value: 'core', label: 'core collection' },
	{ value: 'core-admin', label: 'core-admin collection' },
] as const;

export type Collection = ( typeof COLLECTIONS )[ number ][ 'value' ];

export function nameToSlug( name: string ): string {
	return (
		name
			// Protect acronyms before conversion
			.replace( /RTL/g, '-rtl' )
			.replace( /LTR/g, '-ltr' )
			.replace( /NE/g, '-ne' )
			// Insert hyphen before each uppercase and convert to lowercase
			.replace( /[A-Z]/g, ( letter ) => `-${ letter.toLowerCase() }` )
			// Insert hyphen before digit when preceded by letter (e.g. Level1 -> level-1)
			.replace( /([a-zA-Z])([0-9])/g, '$1-$2' )
	);
}

export const ICON_NAMES = Object.keys( availableIcons );
