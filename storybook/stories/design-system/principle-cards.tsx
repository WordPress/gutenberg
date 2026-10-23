import { Card, Link, Stack, Text } from '@wordpress/ui';
import styles from './package-cards.module.scss';

const principles = [
	{
		title: 'Cohesive by design',
		body: (
			<>
				Unlike <code>@wordpress/components</code>, which grew
				organically as a collection of unrelated UI elements, this
				design system guarantees user- and developer-facing cohesion
				through a unified token system and consistent component
				patterns.
			</>
		),
	},
	{
		title: 'Flexible theming',
		body: (
			<>
				Built from the ground up to support customizable color schemes
				and user personalization—capabilities needed to support the{ ' ' }
				<Link
					href="https://github.com/WordPress/gutenberg/issues/71196"
					openInNewTab
				>
					Phase 3 admin redesign initiative
				</Link>
				.
			</>
		),
	},
	{
		title: 'Modern distribution',
		body: (
			<>
				Distributed as a versioned npm package following{ ' ' }
				<Link href="https://semver.org/" openInNewTab>
					semantic versioning
				</Link>
				, rather than being bundled as a WordPress script on the{ ' ' }
				<code>window.wp</code> global.
			</>
		),
	},
	{
		title: 'Composable architecture',
		body: 'Components follow consistent patterns with proper composability, ref forwarding, and flexible rendering—avoiding the bloated abstractions that emerged from historical scope creep.',
	},
];

export const PrincipleCards = () => (
	<Stack
		direction="row"
		gap="lg"
		wrap="wrap"
		className={ styles[ 'card-group' ] }
	>
		{ principles.map( ( { title, body } ) => (
			<Card.Root
				key={ title }
				className={ `sb-unstyled ${ styles[ 'principle-card' ] }` }
			>
				<Card.Content>
					<Stack direction="column" gap="md">
						<Text variant="heading-md" render={ <h4 /> }>
							{ title }
						</Text>
						<Text variant="body-md" render={ <p /> }>
							{ body }
						</Text>
					</Stack>
				</Card.Content>
			</Card.Root>
		) ) }
	</Stack>
);
