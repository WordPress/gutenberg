/**
 * External dependencies
 */
import type { Meta } from '@storybook/react-vite';
import type { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	SearchControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
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

// Keywords for icon search (mirrored from packages/icons/src/icon/stories/keywords.ts)
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

const PUBLIC_ICONS = new Set(
	manifest
		.filter( ( entry: { public?: boolean } ) => !! entry.public )
		.map( ( entry: { slug: string } ) => entry.slug )
);

function nameToSlug( name: string ): string {
	return name.replace( /[A-Z]/g, ( letter ) => `-${ letter.toLowerCase() }` );
}

const meta: Meta = {
	component: Icon,
	title: 'Icons/Icon',
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
};
export default meta;

const LibraryExample = (): ReactElement => {
	const [ filter, setFilter ] = useState< string >( '' );
	const [ size, setSize ] = useState< string | number | undefined >( '24' );
	const [ highlightPublicIcons, setHighlightPublicIcons ] =
		useState< boolean >( false );
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
		<Spacer padding={ 10 }>
			<VStack spacing={ 8 }>
				<HStack justify="flex-start" alignment="end" spacing={ 8 } wrap>
					<SearchControl
						__next40pxDefaultSize
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
							setSize( value )
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
							setHighlightPublicIcons( value )
						}
						help="Emphasize icons available in the SVG icon registry."
					/>
				</HStack>
				{ hasResults ? (
					<Grid templateColumns="repeat(auto-fill, minmax(100px, 1fr))">
						{ Object.entries( filteredIcons ).map(
							( [ name, icon ] ) => {
								const isPublic = PUBLIC_ICONS.has(
									nameToSlug( name )
								);
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
												! isPublic
													? 0.2
													: 1,
										} }
									>
										<Icon
											icon={ icon }
											size={ Number( size ) }
										/>
										<span style={ { fontSize: 11 } }>
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
		</Spacer>
	);
};

export const Library = (): ReactElement => <LibraryExample />;
