import type { Meta, StoryObj } from '@storybook/react-vite';
import { addons } from 'storybook/preview-api';
import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import {
	renderToString,
	useEffect,
	useRef,
	useState,
	type Element as ReactElement,
	type Ref,
} from '@wordpress/element';
import {
	SearchControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalGrid as Grid,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import * as iconsPackage from '@wordpress/icons';
import { Badge, Button, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import manifest from '../../../packages/icons/src/manifest.json';
import { SET_QUERY_PARAMS } from '../../addons/query-params/constants';

const { Icon, ...availableIcons } = iconsPackage;

type IconComponent = ( typeof availableIcons )[ keyof typeof availableIcons ];

const ALL_ICONS_MANIFEST = new Map(
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

const COLLECTIONS = [ 'all', 'core', 'core-admin' ] as const;

type Collection = ( typeof COLLECTIONS )[ number ];

const ICON_QUERY_PARAM = 'icon';

const COPY_FEEDBACK_TIMEOUT = 2000;

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

function getIconFromUrl(): string | null {
	// The manager forwards its custom query params to the preview iframe.
	return new URLSearchParams( window.location.search ).get(
		ICON_QUERY_PARAM
	);
}

function setIconInUrl( slug: string | null ) {
	addons
		.getChannel()
		.emit( SET_QUERY_PARAMS, { [ ICON_QUERY_PARAM ]: slug } );
}

function CopySvgButton( { icon }: { icon: IconComponent } ) {
	const [ result, setResult ] = useState< {
		status: 'idle' | 'copied' | 'error';
	} >( { status: 'idle' } );

	useEffect( () => {
		if ( result.status === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setResult( { status: 'idle' } ),
			COPY_FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ result ] );

	const ref = useCopyToClipboard(
		() => renderToString( icon ),
		() => {
			// A new object restarts the timeout for repeated copies.
			setResult( { status: 'copied' } );
			speak( 'Copied to clipboard' );
		},
		() => {
			setResult( { status: 'error' } );
			speak( "Couldn't copy to clipboard." );
		}
	);

	return (
		<Button ref={ ref } variant="outline" tone="neutral" size="small">
			<Button.Icon
				icon={
					{
						idle: iconsPackage.copy,
						copied: iconsPackage.check,
						error: iconsPackage.error,
					}[ result.status ]
				}
			/>
			Copy SVG
		</Button>
	);
}

function AvailabilityBadge( {
	label,
	isAvailable,
}: {
	label: string;
	isAvailable: boolean;
} ) {
	return (
		<li>
			<Badge
				intent={ isAvailable ? 'stable' : 'none' }
				style={ isAvailable ? undefined : { opacity: 0.5 } }
			>
				{ label }
			</Badge>
			{ ! isAvailable && (
				<VisuallyHidden>(not available)</VisuallyHidden>
			) }
		</li>
	);
}

function IconDetails( {
	name,
	icon,
	headingRef,
}: {
	name: string;
	icon: IconComponent;
	headingRef: Ref< HTMLHeadingElement >;
} ) {
	const slug = nameToSlug( name );
	const iconInfo = ALL_ICONS_MANIFEST.get( slug );
	const collections = iconInfo?.collections ?? [];

	return (
		<Stack
			direction="row"
			gap="xl"
			align="center"
			wrap="wrap"
			style={ {
				padding: 24,
				border: '1px solid #ddd',
				borderRadius: 4,
			} }
		>
			<Icon icon={ icon } size={ 128 } />
			<Stack direction="column" gap="md" align="flex-start">
				<Text
					ref={ headingRef }
					render={ <h2 /> }
					variant="heading-lg"
					tabIndex={ -1 }
					style={ { margin: 0 } }
				>
					{ iconInfo?.label ?? name }
				</Text>
				<code>{ slug }</code>
				<CopySvgButton icon={ icon } />
				<Stack direction="column" gap="sm" align="flex-start">
					<Text variant="body-sm">Available in</Text>
					<Stack
						render={ <ul /> }
						direction="row"
						gap="sm"
						wrap="wrap"
						style={ { margin: 0, padding: 0, listStyle: 'none' } }
					>
						<AvailabilityBadge
							label="@wordpress/icons"
							isAvailable
						/>
						<AvailabilityBadge
							label="core collection"
							isAvailable={ collections.includes( 'core' ) }
						/>
						<AvailabilityBadge
							label="core-admin collection"
							isAvailable={ collections.includes( 'core-admin' ) }
						/>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
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
	const [ selectedName, setSelectedName ] = useState( () => {
		const slugFromUrl = getIconFromUrl();
		return (
			Object.keys( availableIcons ).find(
				( name ) => nameToSlug( name ) === slugFromUrl
			) ?? null
		);
	} );
	const detailsHeadingRef = useRef< HTMLHeadingElement >( null );

	// Drop the param when leaving the story, so it doesn't stick to the URL
	// of other stories.
	useEffect( () => () => setIconInUrl( null ), [] );

	const selectIcon = ( name: string ) => {
		setSelectedName( name );
		setIconInUrl( nameToSlug( name ) );
		// Move focus to the details shown above the list. Focusing also
		// scrolls them into view.
		requestAnimationFrame( () => detailsHeadingRef.current?.focus() );
	};
	const normalizedFilter = filter.toLowerCase();
	const filteredIcons = Object.fromEntries(
		Object.entries( availableIcons ).filter( ( [ name ] ) => {
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
		} )
	);

	const hasResults = Object.keys( filteredIcons ).length > 0;

	return (
		<div style={ { padding: 10 } }>
			<VStack spacing={ 8 }>
				{ selectedName && (
					<IconDetails
						name={ selectedName }
						icon={
							availableIcons[
								selectedName as keyof typeof availableIcons
							]
						}
						headingRef={ detailsHeadingRef }
					/>
				) }
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
									<button
										key={ name }
										type="button"
										aria-pressed={ name === selectedName }
										onClick={ () => selectIcon( name ) }
										style={ {
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											gap: 8,
											padding: 8,
											border:
												name === selectedName
													? '1px solid currentColor'
													: '1px solid transparent',
											borderRadius: 4,
											background: 'none',
											color: 'inherit',
											cursor: 'pointer',
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
									</button>
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
