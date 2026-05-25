import { Fragment } from '@wordpress/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import * as icons from '@wordpress/icons';
import { Button } from '../index';
import { Icon } from '../../icon';
import type { IconProps } from '../../icon/types';

type IconLibrary = Omit< typeof icons, 'Icon' >;
type IconSlug = Extract< keyof IconLibrary, string >;

const iconLibrary = Object.fromEntries(
	Object.entries( icons ).filter( ( [ slug ] ) => slug !== 'Icon' )
) as IconLibrary;

const allIconEntries = Object.entries( iconLibrary ).sort(
	( [ firstSlug ], [ secondSlug ] ) => firstSlug.localeCompare( secondSlug )
) as Array< [ IconSlug, IconProps[ 'icon' ] ] >;

// Mirrors the affected-icon set from the linked issue demo.
const flaggedIconSlugs = [
	'keyboardClose',
	'pages',
	'copy',
	'gallery',
	'wordpress',
	'insertBefore',
	'capturePhoto',
	'classic',
	'captureVideo',
	'blockTable',
	'calendar',
	'cover',
	'grid',
	'image',
	'media',
	'postDate',
	'tableColumnAfter',
	'tableColumnBefore',
	'tableColumnDelete',
	'tableRowAfter',
	'tableRowBefore',
	'tableRowDelete',
	'table',
	'video',
	'addTemplate',
	'commentContent',
	'store',
	'addCard',
	'box',
	'insertAfter',
	'commentAuthorName',
	'comment',
	'flipHorizontal',
	'flipVertical',
	'caption',
	'drawerLeft',
	'drawerRight',
	'footer',
	'header',
	'inbox',
	'layout',
	'overlayText',
	'postCommentsCount',
	'postCommentsForm',
	'postList',
	'preformatted',
	'sidebar',
	'archive',
	'file',
	'offline',
	'formatRTL',
	'navigationOverlay',
	'postFeaturedImage',
	'pullquote',
	'shortcode',
	'widget',
	'atSymbol',
	'commentEditLink',
	'commentReplyLink',
	'copySmall',
	'formatLTR',
	'homeButton',
	'postCategories',
	'postComments',
	'removeSubmenu',
	'timeToRead',
	'addSubmenu',
	'html',
] as const satisfies readonly IconSlug[];

const iconStorySectionStyle = {
	display: 'grid',
	gap: '1rem',
	color: 'var(--wpds-color-fg-content-neutral)',
	fontSize: 'var(--wpds-typography-font-size-sm)',
} satisfies React.CSSProperties;

const iconStorySubsectionStyle = {
	display: 'grid',
	gap: '0.75rem',
} satisfies React.CSSProperties;

const iconStoryHeaderStyle = {
	color: 'var(--wpds-color-fg-content-neutral-weak)',
	fontSize: 'var(--wpds-typography-font-size-xs)',
	fontWeight: 500,
	textTransform: 'uppercase' as const,
} satisfies React.CSSProperties;

const flaggedIconGridStyle = {
	display: 'grid',
	gridTemplateColumns: 'minmax(12rem, max-content) max-content max-content',
	gap: '12px 24px',
	alignItems: 'center',
} satisfies React.CSSProperties;

const allIconsGridStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
	gap: '12px',
} satisfies React.CSSProperties;

function FlaggedIconRow( { slug }: { slug: IconSlug } ) {
	const icon = iconLibrary[ slug ];

	return (
		<Fragment key={ slug }>
			<div style={ { fontWeight: 500 } }>{ slug }</div>
			<Icon icon={ icon } size={ 24 } />
			<Button>
				<Button.Icon icon={ icon } />
				Label
			</Button>
		</Fragment>
	);
}

function ButtonIconSample( {
	icon,
	slug,
}: {
	icon: IconProps[ 'icon' ];
	slug: IconSlug;
} ) {
	return (
		<Button size="compact" tone="neutral" variant="minimal">
			<Button.Icon icon={ icon } />
			{ slug }
		</Button>
	);
}

const meta: Meta< typeof Button > = {
	title: 'Design System/Components/Button',
	component: Button,
	subcomponents: {
		'Button.Icon': Button.Icon,
	},
	argTypes: {
		'aria-pressed': {
			control: { type: 'boolean' },
		},
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and text overflow behavior. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Button >;

export const Default: Story = {
	args: {
		children: 'Button',
	},
};

export const Outline: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'outline',
	},
};

export const Minimal: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'minimal',
	},
};

export const Compact: Story = {
	...Default,
	args: {
		...Default.args,
		size: 'compact',
	},
};

export const Small: Story = {
	...Default,
	args: {
		...Default.args,
		size: 'small',
	},
};

export const Neutral: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
	},
};

export const NeutralOutline: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
		variant: 'outline',
	},
};

export const Unstyled: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'unstyled',
	},
};

export const AllTonesAndVariants: Story = {
	...Default,
	render: ( args ) => (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'max-content repeat(2, max-content)',
				color: 'var(--wpds-color-fg-content-neutral)',
			} }
		>
			<div></div>
			<div style={ { textAlign: 'center' } }>Resting</div>
			<div style={ { textAlign: 'center' } }>Disabled</div>
			{ ( [ 'brand', 'neutral' ] as const ).map( ( tone ) => (
				<Fragment key={ tone }>
					{ (
						[ 'solid', 'outline', 'minimal', 'unstyled' ] as const
					 ).map( ( variant ) => (
						<Fragment key={ variant }>
							<div
								style={ {
									paddingInlineEnd: '1rem',
									display: 'flex',
									alignItems: 'center',
								} }
							>
								{ variant }, { tone }
							</div>
							<div
								style={ {
									padding: '0.5rem 1rem',
									display: 'flex',
									alignItems: 'center',
								} }
							>
								<Button
									{ ...args }
									tone={ tone }
									variant={ variant }
								/>
							</div>
							<div
								style={ {
									padding: '0.5rem 1rem',
									display: 'flex',
									alignItems: 'center',
								} }
							>
								<Button
									{ ...args }
									tone={ tone }
									variant={ variant }
									disabled
								/>
							</div>
						</Fragment>
					) ) }
				</Fragment>
			) ) }
		</div>
	),
};

export const WithIcon: Story = {
	...Default,
	args: {
		...Default.args,
		children: (
			<>
				<Button.Icon icon={ iconLibrary.cog } />
				Button
			</>
		),
	},
};

export const IconLibrary: Story = {
	render: () => (
		<div style={ iconStorySectionStyle }>
			<section style={ iconStorySubsectionStyle }>
				<h2 style={ { fontSize: '1rem', margin: 0 } }>Flagged icons</h2>
				<div style={ flaggedIconGridStyle }>
					<div />
					<div style={ iconStoryHeaderStyle }>
						Icon (native viewBox)
					</div>
					<div style={ iconStoryHeaderStyle }>Button.Icon</div>
					{ flaggedIconSlugs.map( ( slug ) => (
						<FlaggedIconRow key={ slug } slug={ slug } />
					) ) }
				</div>
			</section>
			<section style={ iconStorySubsectionStyle }>
				<h2 style={ { fontSize: '1rem', margin: 0 } }>All icons</h2>
				<div style={ allIconsGridStyle }>
					{ allIconEntries.map( ( [ slug, icon ] ) => (
						<ButtonIconSample
							key={ slug }
							icon={ icon }
							slug={ slug }
						/>
					) ) }
				</div>
			</section>
		</div>
	),
};

export const Loading: Story = {
	...Default,
	args: {
		...Default.args,
		loading: true,
		loadingAnnouncement: 'Saving data',
	},
};

/**
 * The pressed state is only available for buttons with `tone="neutral"` and
 * `variant="minimal"` and can be toggled via the `aria-pressed` HTML attribute.
 */
export const Pressed: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
		variant: 'minimal',
		'aria-pressed': true,
	},
};
