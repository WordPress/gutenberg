/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { useArgs } from 'storybook/preview-api';

/**
 * WordPress dependencies
 */
import {
	SearchControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalGrid as Grid,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
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
	timeToRead: [ 'clock' ],
	trash: [ 'delete' ],
	unseen: [ 'hide' ],
};

const ALL_ICONS_MANIFEST = new Map(
	manifest.map( ( entry: { slug: string; public?: boolean } ) => [
		entry.slug,
		{ slug: entry.slug, public: !! entry.public },
	] )
);

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
	title: 'Icons/Icon',
	tags: [ '!autodocs' ],
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
	argTypes: {
		filter: { control: false },
		size: { control: false },
		highlightPublicIcons: { control: false },
	},
};
export default meta;

type LibraryArgs = {
	filter: string;
	size: string | number;
	highlightPublicIcons: boolean;
};

type LibraryExampleProps = LibraryArgs & {
	updateArgs: ( newArgs: Partial< LibraryArgs > ) => void;
};

const LibraryExample = ( {
	filter,
	size,
	highlightPublicIcons,
	updateArgs,
}: LibraryExampleProps ): ReactElement => {
	const filteredIcons = filter.length
		? Object.fromEntries(
				Object.entries( availableIcons ).filter( ( [ name ] ) => {
					const normalizedName = name.toLowerCase();
					const normalizedFilter = filter.toLowerCase();

					return (
						normalizedName.includes( normalizedFilter ) ||
						keywords[ name ]?.some( ( keyword: string ) =>
							keyword.toLowerCase().includes( normalizedFilter )
						)
					);
				} )
		  )
		: availableIcons;

	const hasResults = Object.keys( filteredIcons ).length > 0;

	return (
		<div style={ { padding: 10 } }>
			<VStack spacing={ 8 }>
				<HStack justify="flex-start" alignment="end" spacing={ 8 } wrap>
					<SearchControl
						__next40pxDefaultSize
						label="Icon name"
						hideLabelFromVision={ false }
						value={ filter }
						onChange={ ( value: string | undefined ) =>
							updateArgs( { filter: value } )
						}
					/>
					<ToggleGroupControl
						label="Icon size"
						isBlock
						value={ size }
						onChange={ ( value: string | number | undefined ) =>
							updateArgs( { size: value } )
						}
						__next40pxDefaultSize
					>
						{ [ '16', '24', '32' ].map( ( option ) => (
							<ToggleGroupControlOption
								key={ option }
								value={ option }
								label={ option }
							/>
						) ) }
					</ToggleGroupControl>
					<ToggleControl
						label="Highlight public icons"
						checked={ highlightPublicIcons }
						onChange={ ( value: boolean ) =>
							updateArgs( { highlightPublicIcons: value } )
						}
						help="Emphasize icons available in the SVG icon registry."
					/>
				</HStack>
				{ hasResults ? (
					<Grid templateColumns="repeat(auto-fill, minmax(100px, 1fr))">
						{ Object.entries( filteredIcons ).map(
							( [ name, icon ] ) => {
								const slug = nameToSlug( name );
								const iconInfo = ALL_ICONS_MANIFEST.get( slug );
								if ( ! iconInfo ) {
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
											opacity:
												highlightPublicIcons &&
												! iconInfo.public
													? 0.2
													: 1,
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

export const Library: StoryObj< typeof meta > = {
	args: {
		filter: '',
		size: '24',
		highlightPublicIcons: false,
	},
	render: function Library() {
		const [ args, updateArgs ] = useArgs< LibraryArgs >();
		return <LibraryExample { ...args } updateArgs={ updateArgs } />;
	},
};
