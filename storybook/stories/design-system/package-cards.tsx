import {
	Icon,
	bell,
	calendar,
	check,
	cog,
	comment,
	globe,
	home,
	image,
	link as linkIcon,
	lock,
	media,
	page,
	pencil,
	plus,
	search,
	starFilled,
	tag,
	trash,
} from '@wordpress/icons';
import { Card, Link, Stack, Text } from '@wordpress/ui';
import styles from './package-cards.module.scss';

const brand = 'var(--wpds-color-background-interactive-brand-strong)';
const neutral = 'var(--wpds-color-background-interactive-neutral)';
const surface = 'var(--wpds-color-background-surface-neutral-strong)';
const surfaceWeak = 'var(--wpds-color-background-surface-neutral-weak)';
const foreground = 'var(--wpds-color-foreground-content-neutral)';
const stroke = 'var(--wpds-color-stroke-surface-neutral)';
const muted = 'var(--wpds-color-stroke-surface-neutral-weak)';

// Corner radii follow the tokens used by the real components: `sm` for
// buttons, inputs and tiles, `xs` for checkboxes, `lg` for cards and panels.
const radius = ( value: string ) => ( { rx: value } ) as React.CSSProperties;
const r = {
	xs: radius( 'min(var(--wpds-border-radius-sm), 2px)' ),
	sm: radius( 'var(--wpds-border-radius-sm)' ),
	lg: radius( 'var(--wpds-border-radius-lg)' ),
};

const Illustration = ( { children }: { children: React.ReactNode } ) => (
	<svg
		viewBox="0 0 320 160"
		preserveAspectRatio="xMidYMid slice"
		className={ styles.illustration }
		aria-hidden="true"
		focusable="false"
	>
		<rect width="320" height="160" fill={ surfaceWeak } />
		{ children }
	</svg>
);

/** Color swatches in a ramp, above a row of token-like bars. */
const ThemingIllustration = () => (
	<Illustration>
		{ [ 0.2, 0.4, 0.6, 0.8, 1 ].map( ( o, i ) => (
			<rect
				key={ i }
				x={ 40 + i * 48 }
				y={ 36 }
				width="40"
				height="56"
				style={ r.lg }
				fill={ brand }
				opacity={ o }
			/>
		) ) }
		{ [ 0.2, 0.4, 0.6, 0.8, 1 ].map( ( o, i ) => (
			<rect
				key={ i }
				x={ 40 + i * 48 }
				y={ 104 }
				width="40"
				height="6"
				rx="3"
				fill={ brand }
				opacity={ o }
			/>
		) ) }
	</Illustration>
);

/** A button, a text field, a toggle and a checkbox. */
const ComponentsIllustration = () => (
	<Illustration>
		<rect
			x="40"
			y="32"
			width="96"
			height="32"
			style={ r.sm }
			fill={ brand }
		/>
		<rect
			x="148"
			y="32"
			width="96"
			height="32"
			style={ r.sm }
			fill={ surface }
			stroke={ stroke }
		/>
		<rect
			x="160"
			y="45"
			width="72"
			height="6"
			rx="3"
			fill={ neutral }
			opacity="0.5"
		/>
		<rect
			x="40"
			y="80"
			width="204"
			height="32"
			style={ r.sm }
			fill={ surface }
			stroke={ stroke }
		/>
		<rect
			x="52"
			y="93"
			width="80"
			height="6"
			rx="3"
			fill={ neutral }
			opacity="0.5"
		/>
		<rect x="256" y="40" width="32" height="18" rx="9" fill={ brand } />
		<circle cx="279" cy="49" r="6" fill={ surface } />
		<rect
			x="256"
			y="86"
			width="20"
			height="20"
			style={ r.xs }
			fill={ brand }
		/>
		<path
			d="M261 96l4 4 7-8"
			fill="none"
			stroke={ surface }
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</Illustration>
);

const glyphs = [
	pencil,
	plus,
	trash,
	cog,
	image,
	page,
	home,
	search,
	starFilled,
	check,
	comment,
	linkIcon,
	tag,
	calendar,
	lock,
	media,
	bell,
	globe,
];

/** A grid of real icons from the library. */
const IconsIllustration = () => (
	<Illustration>
		{ glyphs.map( ( glyph, i ) => {
			const x = 44 + ( i % 6 ) * 40;
			const y = 24 + Math.floor( i / 6 ) * 40;
			return (
				<g key={ i } transform={ `translate(${ x } ${ y })` }>
					<rect
						width="32"
						height="32"
						style={ r.sm }
						fill={ surface }
						stroke={ muted }
					/>
					<g
						transform="translate(4 4)"
						style={ { color: i === 3 ? brand : foreground } }
					>
						<Icon icon={ glyph } size={ 24 } />
					</g>
				</g>
			);
		} ) }
	</Illustration>
);

/** A table with a filter bar and selectable rows. */
const DataViewsIllustration = () => (
	<Illustration>
		<rect
			x="40"
			y="24"
			width="240"
			height="112"
			style={ r.lg }
			fill={ surface }
			stroke={ stroke }
		/>
		<rect
			x="52"
			y="36"
			width="64"
			height="14"
			style={ r.sm }
			fill={ surface }
			stroke={ stroke }
		/>
		<rect
			x="124"
			y="36"
			width="40"
			height="14"
			style={ r.sm }
			fill={ brand }
		/>
		{ [ 0, 1, 2, 3 ].map( ( i ) => {
			const top = 62 + i * 18;
			return (
				<g key={ i }>
					<line
						x1="40"
						x2="280"
						y1={ top }
						y2={ top }
						stroke={ muted }
					/>
					<rect
						x="52"
						y={ top + 5 }
						width="8"
						height="8"
						style={ r.xs }
						fill={ i === 1 ? brand : 'none' }
						stroke={ i === 1 ? brand : stroke }
					/>
					<rect
						x="74"
						y={ top + 6 }
						width={ 70 + ( ( i * 23 ) % 40 ) }
						height="6"
						rx="3"
						fill={ neutral }
						opacity="0.5"
					/>
					<rect
						x="200"
						y={ top + 6 }
						width="60"
						height="6"
						rx="3"
						fill={ neutral }
						opacity="0.25"
					/>
				</g>
			);
		} ) }
	</Illustration>
);

/** A page frame: full-height sidebar, header with one primary action, content. */
const AdminUIIllustration = () => (
	<Illustration>
		<clipPath id="package-cards-admin-ui-frame">
			<rect x="40" y="20" width="240" height="120" style={ r.lg } />
		</clipPath>
		<rect
			x="40"
			y="20"
			width="240"
			height="120"
			style={ r.lg }
			fill={ surface }
		/>
		<g clipPath="url(#package-cards-admin-ui-frame)">
			<rect x="40" y="20" width="60" height="120" fill={ surfaceWeak } />
		</g>
		<line x1="100" x2="100" y1="20" y2="140" stroke={ muted } />
		<line x1="100" x2="280" y1="46" y2="46" stroke={ muted } />
		<rect x="52" y="30" width="24" height="8" rx="4" fill={ neutral } />
		{ [ 0, 1, 2, 3 ].map( ( i ) => (
			<rect
				key={ i }
				x="52"
				y={ 58 + i * 18 }
				width="36"
				height="6"
				rx="3"
				fill={ neutral }
				opacity={ i === 0 ? 0.7 : 0.35 }
			/>
		) ) }
		<rect
			x="112"
			y="30"
			width="56"
			height="8"
			rx="4"
			fill={ neutral }
			opacity="0.6"
		/>
		<rect
			x="244"
			y="28"
			width="24"
			height="12"
			style={ r.sm }
			fill={ brand }
		/>
		<rect
			x="112"
			y="58"
			width="156"
			height="28"
			style={ r.sm }
			fill={ surfaceWeak }
		/>
		<rect
			x="112"
			y="96"
			width="156"
			height="32"
			style={ r.sm }
			fill={ surfaceWeak }
		/>
		<rect
			x="40"
			y="20"
			width="240"
			height="120"
			style={ r.lg }
			fill="none"
			stroke={ stroke }
		/>
	</Illustration>
);

const illustrations = {
	theming: ThemingIllustration,
	components: ComponentsIllustration,
	icons: IconsIllustration,
	dataviews: DataViewsIllustration,
	adminui: AdminUIIllustration,
};

const PackageCard = ( {
	illustration,
	title,
	packageName,
	children,
	storybookId,
	docsHref,
}: {
	illustration: keyof typeof illustrations;
	title: string;
	packageName: string;
	children: React.ReactNode;
	storybookId: string;
	docsHref: string;
} ) => {
	const Art = illustrations[ illustration ];
	return (
		<Card.Root className={ `sb-unstyled ${ styles.card }` }>
			<Card.Content>
				<Card.FullBleed>
					<Art />
				</Card.FullBleed>
			</Card.Content>
			<Card.Content className={ styles.body }>
				<Stack direction="column" gap="md">
					<Stack direction="column" gap="xs">
						<Text variant="heading-lg" render={ <h4 /> }>
							{ title }
						</Text>
						<Text variant="body-sm" render={ <code /> }>
							{ packageName }
						</Text>
					</Stack>
					<Text variant="body-md" render={ <p /> }>
						{ children }
					</Text>
					<Stack direction="row" gap="lg" wrap="wrap">
						<Link
							href={ `./?path=/docs/${ storybookId }` }
							target="_top"
						>
							See more
						</Link>
						<Link href={ docsHref } openInNewTab>
							Developer documentation
						</Link>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

const handbook =
	'https://developer.wordpress.org/block-editor/reference-guides/packages';

const cards: Array< {
	illustration: keyof typeof illustrations;
	title: string;
	packageName: string;
	body: string;
	storybookId: string;
	docsHref: string;
} > = [
	{
		illustration: 'theming',
		title: 'Theming',
		packageName: '@wordpress/theme',
		body: 'Design tokens for colors, spacing, typography and more, plus a ThemeProvider that generates accessible color ramps from seed values.',
		storybookId: 'design-system-theme-introduction--docs',
		docsHref: `${ handbook }/packages-theme/`,
	},
	{
		illustration: 'components',
		title: 'Components',
		packageName: '@wordpress/ui',
		body: 'Themeable, accessible React components with consistent patterns, styled entirely with design tokens.',
		storybookId: 'design-system-components-introduction--docs',
		docsHref: `${ handbook }/packages-ui/`,
	},
	{
		illustration: 'icons',
		title: 'Icons',
		packageName: '@wordpress/icons',
		body: 'A curated library of SVG icons covering common editor and admin actions, drawn in one shared visual language.',
		storybookId: 'icons-icon--docs',
		docsHref: `${ handbook }/packages-icons/`,
	},
	{
		illustration: 'dataviews',
		title: 'DataViews',
		packageName: '@wordpress/dataviews',
		body: 'Display, filter and edit lists of data as a table, grid or list, with DataForm for editing individual records.',
		storybookId: 'dataviews-dataviews--docs',
		docsHref: `${ handbook }/packages-dataviews/`,
	},
	{
		illustration: 'adminui',
		title: 'Admin UI',
		packageName: '@wordpress/admin-ui',
		body: 'Building blocks for consistent admin page layouts and headers.',
		storybookId: 'admin-ui-page--docs',
		docsHref: `${ handbook }/packages-admin-ui/`,
	},
];

export const PackageCards = ( {
	only,
}: {
	only: Array< keyof typeof illustrations >;
} ) => (
	<Stack
		direction="row"
		gap="lg"
		wrap="wrap"
		className={ styles[ 'card-group' ] }
	>
		{ cards
			.filter( ( card ) => only.includes( card.illustration ) )
			.map( ( { body, ...card } ) => (
				<PackageCard key={ card.illustration } { ...card }>
					{ body }
				</PackageCard>
			) ) }
	</Stack>
);
