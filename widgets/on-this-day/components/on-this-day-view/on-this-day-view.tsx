/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { humanTimeDiff } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { EmptyState, Link, Stack, Text, Button } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { UseOnThisDayPostResult } from '../../hooks/use-on-this-day-post';
import styles from './style.module.css';

/**
 * Named background filter presets. The widget exposes the chosen preset
 * as an attribute; the surface picks the preset and the view resolves it
 * to a CSS filter expression.
 */
export type BackgroundEffect =
	| 'vintage'
	| 'dim-saturate'
	| 'dim-blur'
	| 'grayscale'
	| 'none';

export const BACKGROUND_EFFECTS: Record< BackgroundEffect, string > = {
	vintage: 'sepia(0.3) brightness(0.55) saturate(0.9)',
	'dim-saturate': 'brightness(0.55) saturate(1.15)',
	'dim-blur': 'brightness(0.5) blur(2px)',
	grayscale: 'grayscale(0.4) brightness(0.55)',
	none: 'none',
};

/**
 * View props: result of the data hook plus the background filter preset.
 */
export interface OnThisDayViewProps extends UseOnThisDayPostResult {
	effect?: BackgroundEffect;
}

/**
 * Presentation for the `On This Day` widget. Decouples chrome and data
 * fetching from the layout so Storybook and tests can drive each branch
 * directly.
 *
 * @param {OnThisDayViewProps} props - The props for the `On This Day` widget.
 * @return {React.ReactNode} - The `On This Day` widget.
 */
export function OnThisDayView( {
	post,
	isResolving,
	effect = 'vintage',
}: OnThisDayViewProps ) {
	if ( isResolving ) {
		return (
			<Text variant="body-md" aria-busy="true">
				{ __( 'Loading…' ) }
			</Text>
		);
	}

	if ( ! post ) {
		return (
			<EmptyState.Root className={ styles[ 'no-posts-today' ] }>
				<EmptyState.Icon icon={ calendar } />
				<EmptyState.Title>
					{ __( 'Nothing on this day yet' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __( 'No posts published on this date in past years.' ) }
				</EmptyState.Description>

				<EmptyState.Actions>
					<Button>{ __( 'Add a post' ) }</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		);
	}

	const hasImage = !! post.featuredImageUrl;
	const filterValue = BACKGROUND_EFFECTS[ effect ] ?? BACKGROUND_EFFECTS.none;
	const relativeTime = sprintf(
		/* translators: %s: Human-readable time difference, e.g. "2 days ago". */
		__( 'On this day, %s' ),
		humanTimeDiff( post.date )
	);
	const containerStyle = hasImage
		? ( {
				'--on-this-day-bg-image': `url(${ post.featuredImageUrl })`,
				'--on-this-day-bg-filter': filterValue,
		  } as React.CSSProperties )
		: undefined;

	return (
		<Stack
			direction="column"
			gap="md"
			className={ clsx(
				styles.container,
				hasImage && styles[ 'with-image' ]
			) }
			style={ containerStyle }
		>
			<Stack direction="column" gap="xs" className={ styles.header }>
				<Text variant="heading-md">{ relativeTime }</Text>
				<Text variant="heading-xl" className={ styles[ 'post-title' ] }>
					<Link
						href={ post.link }
						tone="neutral"
						variant={ hasImage ? 'unstyled' : 'default' }
					>
						{ decodeEntities( post.title.rendered ) }
					</Link>
				</Text>
				{ post.commentCount > 0 && (
					<Stack direction="row" gap="sm" align="center">
						<Text variant="body-sm">
							{ sprintf(
								/* translators: %d: number of comments */
								_n(
									'%d comment',
									'%d comments',
									post.commentCount
								),
								post.commentCount
							) }
						</Text>
					</Stack>
				) }
			</Stack>
		</Stack>
	);
}
