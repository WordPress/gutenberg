import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import {
	useEffect,
	useState,
	type Element as ReactElement,
} from '@wordpress/element';
import {
	SearchControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { Icon } from '@wordpress/icons';
import { Link, Notice, Stack } from '@wordpress/ui';
import { IconDetails } from './icon-details';
import { IconGrid } from './icon-grid';
import {
	COLLECTIONS,
	ICON_NAMES,
	nameToSlug,
	type Collection,
} from './manifest';
import styles from './library.module.scss';

const meta: Meta = {
	component: Icon,
	id: 'icons-icon',
	title: 'Design System/Icons/Icon',
	tags: [ '!autodocs' ],
	parameters: {
		controls: { hideNoControlsWarning: true },
		layout: 'fullscreen',
	},
	argTypes: {
		filter: { control: false },
		collection: { control: false },
		icon: { control: false },
	},
};
export default meta;

const COLLECTION_DESCRIPTIONS: Record< Collection, ReactElement > = {
	all: (
		<>
			All icons are available. Import them from the npm package in
			JavaScript.{ ' ' }
			<Link
				href="https://developer.wordpress.org/block-editor/reference-guides/packages/packages-icons/#usage"
				openInNewTab
			>
				See the usage example
			</Link>
			.
		</>
	),
	core: (
		<>
			These icons are registered in WordPress. Render them in PHP with{ ' ' }
			<Link
				href="https://developer.wordpress.org/reference/functions/wp_get_icon/"
				openInNewTab
			>
				wp_get_icon()
			</Link>
			. They are also available through the Icons REST API and in the Icon
			block.
		</>
	),
	'core-admin': (
		<>
			These icons are registered in WordPress for the admin interface.
			Render them in PHP with{ ' ' }
			<Link
				href="https://developer.wordpress.org/reference/functions/wp_get_icon/"
				openInNewTab
			>
				wp_get_icon()
			</Link>
			. They are not available through the Icons REST API or in the Icon
			block.
		</>
	),
};

type LibraryArgs = {
	filter: string;
	collection: Collection;
	/**
	 * Slug of the selected icon. Storybook keeps changed args in the URL, so
	 * the selection can be shared as a link.
	 */
	icon?: string;
};

const LibraryExample = ( {
	filter: initialFilter,
	collection: initialCollection,
	icon,
	onSelectIcon,
}: LibraryArgs & {
	onSelectIcon: ( slug: string ) => void;
} ): ReactElement => {
	const [ filter, setFilter ] = useState( initialFilter );
	const [ collection, setCollection ] = useState( initialCollection );
	// Select locally first, so the grid updates without waiting for the
	// args round trip through the Storybook manager.
	const [ selectedSlug, setSelectedSlug ] = useState( icon );
	useEffect( () => setSelectedSlug( icon ), [ icon ] );
	const selectedName =
		ICON_NAMES.find( ( name ) => nameToSlug( name ) === selectedSlug ) ??
		null;

	return (
		<Stack gap="3xl" className={ styles.layout }>
			<Stack direction="column" gap="md" className={ styles.details }>
				<SearchControl
					label="Icon name"
					hideLabelFromVision={ false }
					value={ filter }
					onChange={ ( value: string | undefined ) =>
						setFilter( value ?? '' )
					}
				/>
				{ selectedName && <IconDetails name={ selectedName } /> }
			</Stack>
			<Stack direction="column" gap="lg" className={ styles.browser }>
				<div style={ { width: 500, maxWidth: '100%' } }>
					<ToggleGroupControl
						label="Available in"
						isBlock
						value={ collection }
						onChange={ ( value: string | number | undefined ) =>
							setCollection( ( value ?? 'all' ) as Collection )
						}
					>
						{ COLLECTIONS.map( ( { value, label } ) => (
							<ToggleGroupControlOption
								key={ value }
								value={ value }
								label={ label }
							/>
						) ) }
					</ToggleGroupControl>
				</div>
				<Notice.Root intent="info">
					<Notice.Description>
						{ COLLECTION_DESCRIPTIONS[ collection ] }
					</Notice.Description>
				</Notice.Root>
				<div className={ styles.grid }>
					<IconGrid
						filter={ filter }
						collection={ collection }
						selectedName={ selectedName }
						onSelect={ ( name ) => {
							const slug = nameToSlug( name );
							setSelectedSlug( slug );
							onSelectIcon( slug );
						} }
					/>
				</div>
			</Stack>
		</Stack>
	);
};

export const Library: StoryObj< LibraryArgs > = {
	args: {
		filter: '',
		collection: 'all',
	},
	render: function Render( args ) {
		const [ , updateArgs ] = useArgs< LibraryArgs >();
		return (
			<LibraryExample
				{ ...args }
				onSelectIcon={ ( slug ) => updateArgs( { icon: slug } ) }
			/>
		);
	},
};
