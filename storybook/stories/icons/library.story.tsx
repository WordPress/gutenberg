import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type Element as ReactElement } from '@wordpress/element';
import {
	SearchControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalGrid as Grid,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import * as iconsPackage from '@wordpress/icons';
import manifest from '../../../packages/icons/src/manifest.json';

const { Icon, ...availableIcons } = iconsPackage;

const keywords: Partial< Record< string, string[] > > = {
	archive: [ 'folder' ],
	atSymbol: [ 'email' ],
	audio: [ 'music' ],
	cancelCircleFilled: [ 'close' ],
	caution: [ 'alert', 'warning' ],
	cautionFilled: [ 'alert', 'warning' ],
	create: [ 'add', 'new', 'plus' ],
	envelope: [ 'email' ],
	error: [ 'alert', 'caution', 'warning' ],
	file: [ 'folder' ],
	lifesaver: [ 'buoy' ],
	seen: [ 'show', 'visible', 'eye' ],
	starFilled: [ 'favorite' ],
	pencil: [ 'edit' ],
	thumbsDown: [ 'dislike' ],
	thumbsUp: [ 'like' ],
	time: [ 'clock', 'duration', 'hour', 'minute', 'second' ],
	trash: [ 'delete' ],
	unseen: [ 'hide' ],
};

const ALL_ICONS_MANIFEST = new Map(
	manifest.map( ( entry: { slug: string; collections?: string[] } ) => [
		entry.slug,
		{ slug: entry.slug, collections: entry.collections ?? [] },
	] )
);

const COLLECTIONS = [ 'all', 'core', 'core-admin' ] as const;

type Collection = ( typeof COLLECTIONS )[ number ];

function nameToSlug( name: string ): string {
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

const meta: Meta = {
	component: Icon,
	id: 'icons-icon',
	title: 'Design System/Icons/Icon',
	tags: [ '!autodocs' ],
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
	argTypes: {
		filter: { control: false },
		size: { control: false },
		collection: { control: false },
	},
};
export default meta;

type LibraryArgs = {
	filter: string;
	size: string | number;
	collection: Collection;
};

const LibraryExample = ( {
	filter: initialFilter,
	size: initialSize,
	collection: initialCollection,
}: LibraryArgs ): ReactElement => {
	const [ filter, setFilter ] = useState( initialFilter );
	const [ size, setSize ] = useState( initialSize );
	const [ collection, setCollection ] = useState( initialCollection );
	const normalizedFilter = filter.toLowerCase();
	const filteredIcons = Object.fromEntries(
		Object.entries( availableIcons ).filter( ( [ name ] ) => {
			if ( collection !== 'all' ) {
				const iconInfo = ALL_ICONS_MANIFEST.get( nameToSlug( name ) );
				if ( ! iconInfo?.collections.includes( collection ) ) {
					return false;
				}
			}

			if ( ! normalizedFilter.length ) {
				return true;
			}

			return (
				name.toLowerCase().includes( normalizedFilter ) ||
				keywords[ name ]?.some( ( keyword: string ) =>
					keyword.toLowerCase().includes( normalizedFilter )
				)
			);
		} )
	);

	const hasResults = Object.keys( filteredIcons ).length > 0;

	return (
		<div style={ { padding: 10 } }>
			<VStack spacing={ 8 }>
				<HStack justify="flex-start" alignment="end" spacing={ 8 } wrap>
					<SearchControl
						label="Icon name"
						hideLabelFromVision={ false }
						value={ filter }
						onChange={ ( value: string | undefined ) =>
							setFilter( value ?? '' )
						}
					/>
					<ToggleGroupControl
						label="Icon size"
						isBlock
						value={ size }
						onChange={ ( value: string | number | undefined ) =>
							setSize( value ?? '24' )
						}
					>
						{ [ '16', '24', '32' ].map( ( option ) => (
							<ToggleGroupControlOption
								key={ option }
								value={ option }
								label={ option }
							/>
						) ) }
					</ToggleGroupControl>
					<ToggleGroupControl
						label="Collection"
						isBlock
						value={ collection }
						onChange={ ( value: string | number | undefined ) =>
							setCollection( ( value ?? 'all' ) as Collection )
						}
					>
						{ COLLECTIONS.map( ( option ) => (
							<ToggleGroupControlOption
								key={ option }
								value={ option }
								label={ option === 'all' ? 'All' : option }
							/>
						) ) }
					</ToggleGroupControl>
				</HStack>
				{ hasResults ? (
					<Grid templateColumns="repeat(auto-fill, minmax(100px, 1fr))">
						{ Object.entries( filteredIcons ).map(
							( [ name, icon ] ) => {
								const slug = nameToSlug( name );
								if ( ! ALL_ICONS_MANIFEST.has( slug ) ) {
									throw new Error(
										`Icon "${ name }" (slug: ${ slug }) is not found in the manifest. Add it to packages/icons/src/manifest.json.`
									);
								}
								return (
									<div
										key={ name }
										style={ {
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											gap: 8,
										} }
									>
										<Icon
											icon={ icon }
											size={ Number( size ) }
										/>
										<span
											style={ {
												fontSize: 11,
												textAlign: 'center',
												wordBreak: 'break-all',
											} }
										>
											{ name }
										</span>
									</div>
								);
							}
						) }
					</Grid>
				) : (
					<p>No icons found.</p>
				) }
			</VStack>
		</div>
	);
};

export const Library: StoryObj< LibraryArgs > = {
	args: {
		filter: '',
		size: '24',
		collection: 'all',
	},
	render: ( args ) => <LibraryExample { ...args } />,
};
