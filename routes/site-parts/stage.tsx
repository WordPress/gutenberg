import type { ReactElement, SVGProps } from 'react';
import { Page } from '@wordpress/admin-ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { chevronRight, symbolFilled } from '@wordpress/icons';
import { Link as RouteLink } from '@wordpress/route';
import { unlock } from '@wordpress/routes-lock-unlock';
import { EmptyState, Icon, Link, Stack, Text } from '@wordpress/ui';
import styles from './style.module.scss';

const { getSitePartAreas, useSitePartsUsage, useUsedOnLabel } =
	unlock( editorPrivateApis );

type SitePartArea = {
	area: string;
	label: string;
	icon: ReactElement< SVGProps< SVGSVGElement > >;
};

function SitePartRow( {
	area,
	label,
	icon,
	partId,
	templateIds,
}: {
	area: string;
	label: string;
	icon: ReactElement< SVGProps< SVGSVGElement > >;
	partId: string;
	templateIds: string[];
} ) {
	const title = useSelect(
		( select ) => {
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				'wp_template_part',
				partId
			) as { title?: string | { rendered?: string } } | undefined;
			const value =
				typeof record?.title === 'string'
					? record.title
					: record?.title?.rendered;
			return decodeEntities( value ?? '' ) || __( '(no title)' );
		},
		[ partId ]
	);
	const usedOn = useUsedOnLabel( templateIds );

	return (
		<li>
			<RouteLink
				to="/site-parts/$area"
				params={ { area } }
				className={ styles.row }
			>
				<Icon icon={ icon } className={ styles[ 'synced-icon' ] } />
				<Stack direction="column" gap="xs" className={ styles.text }>
					<Text variant="body-md" className={ styles.label }>
						{ label }
					</Text>
					<Text variant="body-sm" className={ styles.description }>
						{ title } · { usedOn }
					</Text>
				</Stack>
				<Icon icon={ chevronRight } />
			</RouteLink>
		</li>
	);
}

function SiteParts() {
	const usage = useSitePartsUsage();
	const rows = ( getSitePartAreas() as SitePartArea[] )
		.map( ( { area, label, icon } ) => {
			const partId = usage?.primary[ area ];
			return partId
				? {
						area,
						label,
						icon,
						partId,
						templateIds: usage.parts[ partId ]?.templates ?? [],
					}
				: null;
		} )
		.filter( ( row ): row is NonNullable< typeof row > => !! row );

	return (
		<Page title={ __( 'Site parts' ) } headingLevel={ 2 }>
			<div className={ styles.content }>
				{ usage && ! rows.length ? (
					<EmptyState.Root>
						<EmptyState.Icon icon={ symbolFilled } />
						<EmptyState.Title>
							{ __( 'No site parts yet' ) }
						</EmptyState.Title>
						<EmptyState.Description>
							{ __(
								'Your homepage doesn’t use a header, footer or navigation overlay.'
							) }
						</EmptyState.Description>
						<EmptyState.Actions>
							<Link
								render={
									<RouteLink
										to="/template-parts/list/$area"
										params={ { area: 'all-parts' } }
									/>
								}
							>
								{ __( 'See all template parts' ) }
							</Link>
						</EmptyState.Actions>
					</EmptyState.Root>
				) : (
					<Stack direction="column" gap="lg">
						<Text
							variant="body-md"
							render={ <p /> }
							className={ styles.description }
						>
							{ __(
								'The parts that appear on every page of your site, like the header at the top and the footer at the bottom.'
							) }
						</Text>
						<ul className={ styles.list }>
							{ rows.map( ( row ) => (
								<SitePartRow key={ row.area } { ...row } />
							) ) }
						</ul>
					</Stack>
				) }
			</div>
		</Page>
	);
}

export const stage = SiteParts;
