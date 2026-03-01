/**
 * External dependencies
 */
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
import Icon from '../';
import check from '../../library/check';
import * as icons from '../../';
import keywords from './keywords';
import manifest from '../../manifest.json';

const { Icon: _Icon, ...availableIcons } = icons;

const PUBLIC_ICONS = new Set(
	manifest
		.filter( ( entry ) => !! entry.public )
		.map( ( entry ) => entry.slug )
);

function nameToSlug( name: string ): string {
	return name.replace( /[A-Z]/g, ( letter ) => `-${ letter.toLowerCase() }` );
}

const meta = {
	component: Icon,
	title: 'Icons/Icon',
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
};
export default meta;

export const Default = (): ReactElement => {
	return (
		<>
			<div>
				<h2>Dashicons (corrected viewport)</h2>

				<Icon icon={ check } />
				<Icon icon={ check } size={ 36 } />
				<Icon icon={ check } size={ 48 } />
			</div>
			<div>
				<h2>Material and Other</h2>

				<Icon icon={ icons.paragraph } />
				<Icon icon={ icons.paragraph } size={ 36 } />
				<Icon icon={ icons.paragraph } size={ 48 } />
			</div>
		</>
	);
};

const LibraryExample = (): ReactElement => {
	const [ filter, setFilter ] = useState< string >( '' );
	const [ size, setSize ] = useState< string | number | undefined >( '32' );
	const [ highlightPublicIcons, setHighlightPublicIcons ] =
		useState< boolean >( false );
	const filteredIcons = filter.length
		? Object.fromEntries(
				Object.entries( availableIcons ).filter( ( [ name ] ) => {
					const normalizedName = name.toLowerCase();
					const normalizedFilter = filter.toLowerCase();

					return (
						normalizedName.includes( normalizedFilter ) ||
						// @ts-expect-error - Not worth the effort to cast `name`
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
				<HStack justify="flex-start" spacing={ 8 } wrap>
					<SearchControl
						__next40pxDefaultSize
						label="Icon name"
						hideLabelFromVision={ false }
						value={ filter }
						onChange={ ( value ) => setFilter( value ) }
					/>
					<ToggleGroupControl
						label="Icon size"
						isBlock
						value={ size }
						onChange={ ( value ) => setSize( value ) }
						__next40pxDefaultSize
					>
						{ [ '24', '32', '40' ].map( ( option ) => (
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
						onChange={ ( value ) =>
							setHighlightPublicIcons( value )
						}
						help="Public icons are those available by default in the WordPress SVG icon registry."
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
									<VStack
										key={ name }
										as="div"
										alignment="center"
										spacing={ 2 }
										style={ {
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
										<span style={ { fontSize: '11px' } }>
											{ name }
										</span>
									</VStack>
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
