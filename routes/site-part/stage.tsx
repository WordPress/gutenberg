import type { ReactElement, SVGProps } from 'react';
import { Page, Breadcrumbs } from '@wordpress/admin-ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { MediaEdit } from '@wordpress/fields';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { chevronRight, symbolFilled } from '@wordpress/icons';
import { useEditorAssets } from '@wordpress/lazy-editor';
import { Link as RouteLink, useParams, useSearch } from '@wordpress/route';
import { unlock } from '@wordpress/routes-lock-unlock';
import { EmptyState, Icon, Link, Spinner, Stack, Text } from '@wordpress/ui';
import styles from './style.module.scss';

const {
	SitePartPanelContent,
	SitePartSyncedNotice,
	getSitePartArea,
	getSitePartPanels,
	useSitePart,
	useUsedOnLabel,
} = unlock( editorPrivateApis );

const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

type PartInUse = { id: string; templates: string[] };
type PanelItem = {
	panel: string;
	label: string;
	icon?: ReactElement< SVGProps< SVGSVGElement > >;
};
type AreaDetails = {
	label: string;
	inUseLabel: string;
	allLabel: string;
	missingLabel: string;
};

function usePartTitle( partId: string | null ) {
	return useSelect(
		( select ) => {
			if ( ! partId ) {
				return '';
			}
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				TEMPLATE_PART_POST_TYPE,
				partId
			) as { title?: string | { rendered?: string } } | undefined;
			const title =
				typeof record?.title === 'string'
					? record.title
					: record?.title?.rendered;
			return decodeEntities( title ?? '' ) || __( '(no title)' );
		},
		[ partId ]
	);
}

function AllPartsLink( { area, label }: { area: string; label: string } ) {
	return (
		<Link
			render={
				<RouteLink
					to="/template-parts/list/$area"
					params={ { area } }
				/>
			}
		>
			{ label }
		</Link>
	);
}

function OtherPartRow( { part }: { part: PartInUse } ) {
	const title = usePartTitle( part.id );
	const usedOn = useUsedOnLabel( part.templates );
	return (
		<li>
			<RouteLink
				to={ `/types/${ TEMPLATE_PART_POST_TYPE }/edit/${ encodeURIComponent(
					part.id
				) }` }
				className={ styles.row }
			>
				<Stack direction="column" gap="xs" className={ styles.text }>
					<Text variant="body-md" className={ styles.label }>
						{ title }
					</Text>
					<Text variant="body-sm" className={ styles.description }>
						{ usedOn }
					</Text>
				</Stack>
				<Icon icon={ chevronRight } />
			</RouteLink>
		</li>
	);
}

/**
 * The area's panels and the parts in use. Mounted once the editor assets have
 * loaded: reading what the part holds parses its blocks, which needs the block
 * types those assets register.
 */
function SitePartContent( {
	area,
	areaDetails,
	activePanelId,
	onPanelChange,
}: {
	area: string;
	areaDetails: AreaDetails;
	activePanelId?: string;
	onPanelChange: ( panel: PanelItem | undefined ) => void;
} ) {
	const { partId, partsInUse, contents } = useSitePart( area );
	const title = usePartTitle( partId );
	const panels: PanelItem[] = partId ? getSitePartPanels( contents ) : [];
	const activePanel = panels.find( ( item ) => item.panel === activePanelId );
	const primaryUsage = partsInUse.find(
		( part: PartInUse ) => part.id === partId
	);
	const usedOn = useUsedOnLabel( primaryUsage?.templates ?? [] );

	// The panel objects are rebuilt on every render, so report the panel by
	// its stable fields.
	const activePanelKey = activePanel?.panel;
	const activePanelLabel = activePanel?.label;
	useEffect( () => {
		onPanelChange(
			activePanelKey && activePanelLabel
				? { panel: activePanelKey, label: activePanelLabel }
				: undefined
		);
	}, [ activePanelKey, activePanelLabel, onPanelChange ] );

	if ( ! partId ) {
		return (
			<EmptyState.Root>
				<EmptyState.Icon icon={ symbolFilled } />
				<EmptyState.Title>
					{ areaDetails.missingLabel }
				</EmptyState.Title>
				<EmptyState.Actions>
					<AllPartsLink
						area={ area }
						label={ areaDetails.allLabel }
					/>
				</EmptyState.Actions>
			</EmptyState.Root>
		);
	}

	if ( activePanel ) {
		return (
			<Stack direction="column" gap="2xl">
				<SitePartSyncedNotice
					area={ area }
					panel={ activePanel.panel }
				/>
				<SitePartPanelContent
					area={ area }
					panel={ activePanel.panel }
					MediaEdit={ MediaEdit }
				/>
			</Stack>
		);
	}

	const otherParts = partsInUse.filter(
		( part: PartInUse ) => part.id !== partId
	);

	return (
		<Stack direction="column" gap="2xl">
			<SitePartSyncedNotice area={ area } />
			<Stack direction="column" gap="xs">
				<Text variant="heading-md" render={ <p /> }>
					{ title }
				</Text>
				<Text
					variant="body-sm"
					render={ <p /> }
					className={ styles.description }
				>
					{ usedOn }
				</Text>
			</Stack>
			{ panels.length > 0 && (
				<ul className={ styles.list }>
					{ panels.map( ( item ) => (
						<li key={ item.panel }>
							<RouteLink
								to="/site-parts/$area"
								params={ { area } }
								search={ { panel: item.panel } }
								className={ styles.row }
							>
								{ item.icon && (
									<Icon
										icon={ item.icon }
										className={ styles[ 'synced-icon' ] }
									/>
								) }
								<Text
									variant="body-md"
									className={ styles.label }
								>
									{ item.label }
								</Text>
								<Icon icon={ chevronRight } />
							</RouteLink>
						</li>
					) ) }
				</ul>
			) }
			{ panels.length > 0 && <hr className={ styles.divider } /> }
			{ otherParts.length > 0 && (
				<Stack direction="column" gap="sm" render={ <section /> }>
					<Text variant="heading-sm" render={ <h3 /> }>
						{ areaDetails.inUseLabel }
					</Text>
					<ul className={ styles.list }>
						{ otherParts.map( ( part: PartInUse ) => (
							<OtherPartRow key={ part.id } part={ part } />
						) ) }
					</ul>
				</Stack>
			) }
			<ul className={ styles.list }>
				<li>
					<RouteLink
						to="/template-parts/list/$area"
						params={ { area } }
						className={ styles.row }
					>
						<Icon icon={ symbolFilled } />
						<Text variant="body-md" className={ styles.label }>
							{ areaDetails.allLabel }
						</Text>
						<Icon icon={ chevronRight } />
					</RouteLink>
				</li>
			</ul>
		</Stack>
	);
}

function SitePart() {
	const { area } = useParams( { from: '/site-parts/$area' } );
	const search = useSearch( { strict: false } ) as { panel?: string };
	const areaDetails: AreaDetails = getSitePartArea( area );
	const { isReady: assetsReady } = useEditorAssets();
	const [ activePanel, setActivePanel ] = useState< PanelItem >();

	const breadcrumbs = [
		{ label: __( 'Site parts' ), to: '/site-parts' },
		activePanel
			? {
					label: areaDetails.label,
					to: `/site-parts/${ area }`,
				}
			: { label: areaDetails.label },
		...( activePanel ? [ { label: activePanel.label } ] : [] ),
	];

	return (
		<Page
			ariaLabel={ activePanel?.label ?? areaDetails.label }
			headingLevel={ 2 }
			breadcrumbs={ <Breadcrumbs items={ breadcrumbs } /> }
		>
			<div className={ styles.content }>
				{ assetsReady ? (
					<SitePartContent
						area={ area }
						areaDetails={ areaDetails }
						activePanelId={ search.panel }
						onPanelChange={ setActivePanel }
					/>
				) : (
					<div className={ styles.loading }>
						<Spinner />
					</div>
				) }
			</div>
		</Page>
	);
}

export const stage = SitePart;
