import {
	Controls,
	Description,
	Primary,
	Stories,
	Subtitle,
	Title,
} from '@storybook/addon-docs/blocks';
import { WithGlobalCSS } from './decorators/with-global-css';
import { WithMaxWidthWrapper } from './decorators/with-max-width-wrapper';
import { WithRTL } from './decorators/with-rtl';
import { WithDesignSystemTheme } from './decorators/with-design-system-theme';
import { ComponentStatusIndicator } from './components/component-status-indicator';

export const globalTypes = {
	direction: {
		name: 'RTL',
		description: 'Simulate an RTL language.',
		defaultValue: 'ltr',
		toolbar: {
			icon: 'globe',
			items: [
				{ value: 'ltr', title: 'LTR' },
				{ value: 'rtl', title: 'RTL' },
			],
		},
	},
	css: {
		name: 'Global CSS',
		description:
			'Inject global CSS that may be loaded in certain contexts.',
		defaultValue: 'basic',
		toolbar: {
			icon: 'document',
			items: [
				{ value: 'none', title: 'None' },
				{ value: 'basic', title: 'Font only' },
				{
					value: 'wordpress',
					title: 'WordPress (common, forms, dashicons)',
				},
			],
		},
	},
	maxWidthWrapper: {
		name: 'Max-Width Wrapper',
		description: 'Wrap the component in a div with a max-width.',
		defaultValue: 'none',
		toolbar: {
			icon: 'outline',
			items: [
				{ value: 'none', title: 'None' },
				{ value: 'wordpress-sidebar', title: 'WP Sidebar' },
				{ value: 'small-container', title: 'Small container' },
				{ value: 'large-container', title: 'Large container' },
			],
		},
	},
	dsColorTheme: {},
	dsDensity: {},
};

export const decorators = [
	WithGlobalCSS,
	WithRTL,
	WithMaxWidthWrapper,
	WithDesignSystemTheme,
];

export const parameters = {
	controls: {
		sort: 'requiredFirst',
	},
	backgrounds: {
		disable: true,
	},
	docs: {
		controls: {
			sort: 'requiredFirst',
		},
		// Flips the order of the description and the primary component story
		// so the component is always visible before the fold.
		page: () => (
			<>
				<Title />
				<Subtitle />
				<ComponentStatusIndicator />
				<Primary />
				<Description />
				<Controls />
				<Stories includePrimary={ false } />
			</>
		),
	},
	options: {
		storySort: ( a, b ) => {
			const SECTION_ORDER = [
				'Docs',
				'Playground',
				'BlockEditor',
				'Components',
				[
					'Actions',
					'Containers',
					'Feedback',
					'Layout',
					'Navigation',
					'Overlays',
					'Selection & Input',
					'Typography',
					'Utilities',
				],
				'Icons',
				'Design System',
			];
			const PRIORITIZED_MDX_DOCS = [ 'Introduction', 'Overview' ];

			// Get order index for a name in an order array (skipping nested arrays)
			const getOrderIndex = ( orderArray, name ) => {
				let index = 0;
				for ( const item of orderArray ) {
					if ( item === name ) {
						return index;
					}
					if ( ! Array.isArray( item ) ) {
						index++;
					}
				}
				return index; // Not found, put at end
			};

			// Get the nested order array that follows a name
			const getNestedOrder = ( orderArray, name ) => {
				for ( let i = 0; i < orderArray.length; i++ ) {
					if (
						orderArray[ i ] === name &&
						Array.isArray( orderArray[ i + 1 ] )
					) {
						return orderArray[ i + 1 ];
					}
				}
				return [];
			};

			// Check if an entry is an MDX doc page ending at a specific path depth
			const isMdxAtDepth = ( entry, path, depth ) =>
				entry.type === 'docs' &&
				path.length === depth + 1 &&
				entry.importPath?.endsWith( '.mdx' );

			const aPath = a.title.split( '/' );
			const bPath = b.title.split( '/' );
			const maxDepth = Math.max( aPath.length, bPath.length );

			let currentOrder = SECTION_ORDER;

			for ( let depth = 0; depth < maxDepth; depth++ ) {
				const aSegment = aPath[ depth ];
				const bSegment = bPath[ depth ];

				// If one path is shorter, check if the longer one is an MDX doc
				// that should appear before stories at the parent level
				if ( aSegment === undefined && bSegment !== undefined ) {
					// MDX subfolder comes before parent's stories
					if (
						a.type === 'story' &&
						isMdxAtDepth( b, bPath, depth )
					) {
						return 1;
					}
					return -1;
				}
				if ( aSegment !== undefined && bSegment === undefined ) {
					// MDX subfolder comes before parent's stories
					if (
						b.type === 'story' &&
						isMdxAtDepth( a, aPath, depth )
					) {
						return -1;
					}
					return 1;
				}

				if ( aSegment !== bSegment ) {
					// MDX pages (importPath ends in .mdx) come before components
					// (whose autodocs are generated from .story.tsx files)
					const aIsMdx = isMdxAtDepth( a, aPath, depth );
					const bIsMdx = isMdxAtDepth( b, bPath, depth );

					if ( aIsMdx !== bIsMdx ) {
						return aIsMdx ? -1 : 1;
					}

					// Among MDX pages, prioritize those in PRIORITIZED_MDX_DOCS
					if ( aIsMdx && bIsMdx ) {
						const aIsPrioritized =
							PRIORITIZED_MDX_DOCS.includes( aSegment );
						const bIsPrioritized =
							PRIORITIZED_MDX_DOCS.includes( bSegment );
						if ( aIsPrioritized !== bIsPrioritized ) {
							return aIsPrioritized ? -1 : 1;
						}
					}

					const aIndex = getOrderIndex( currentOrder, aSegment );
					const bIndex = getOrderIndex( currentOrder, bSegment );
					if ( aIndex !== bIndex ) {
						return aIndex - bIndex;
					}
					// Same index (both not in order list), sort alphabetically
					return aSegment.localeCompare( bSegment );
				}

				// Same segment, descend into nested order
				currentOrder = getNestedOrder( currentOrder, aSegment );
			}

			// Same title - sort by type:
			// 0: autodocs "Docs"
			// 1: prioritized MDX pages (Introduction, Overview, etc.)
			// 2: other MDX docs
			// 3: stories (which appear before subfolders due to shorter paths)
			const getPriority = ( entry ) => {
				if ( entry.type === 'docs' && entry.name === 'Docs' ) {
					return 0;
				}
				if (
					entry.type === 'docs' &&
					PRIORITIZED_MDX_DOCS.includes( entry.name )
				) {
					return 1;
				}
				if ( entry.type === 'docs' ) {
					return 2;
				}
				return 3;
			};
			const aPriority = getPriority( a );
			const bPriority = getPriority( b );
			if ( aPriority !== bPriority ) {
				return aPriority - bPriority;
			}

			// Same priority, sort alphabetically by name
			return a.name.localeCompare( b.name );
		},
	},
};

export const tags = [ 'autodocs' ];
