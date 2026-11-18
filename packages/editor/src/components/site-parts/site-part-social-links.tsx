import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import {
	InputControl,
	InputLayout,
	SelectControl,
	Stack,
	Text,
} from '@wordpress/ui';
import {
	replaceFirstBlock,
	type SitePartBlock,
	type SitePartContents,
} from './get-site-part-contents';

const SOCIAL_LINKS = 'core/social-links';
const SOCIAL_LINK = 'core/social-link';

interface Service {
	name: string;
	title: string;
}

/**
 * Edits the links in a site part's Social Icons block: each link's address,
 * removing links, and adding a link for another service. Edits go to the
 * part, so they show on the canvas and save with it.
 *
 * @param props              Component props.
 * @param props.blocks       The part's blocks.
 * @param props.contents     What the part holds.
 * @param props.setBlocks    Replaces the part's blocks.
 * @param props.commitBlocks Ends a run of typing with an undo level.
 */
export default function SitePartSocialLinks( {
	blocks,
	contents,
	setBlocks,
	commitBlocks,
}: {
	blocks: SitePartBlock[];
	contents: SitePartContents;
	setBlocks: (
		blocks: SitePartBlock[],
		options?: { isTransient?: boolean }
	) => void;
	commitBlocks: () => void;
} ) {
	const services = useSelect(
		( select ) =>
			( select( blocksStore ).getBlockVariations( SOCIAL_LINK ) ??
				[] ) as Service[],
		[]
	);
	const links = ( contents.socialLinks?.innerBlocks ?? [] ).filter(
		( block ) => block.name === SOCIAL_LINK
	);

	const getTitle = ( name: string ) =>
		services.find( ( service ) => service.name === name )?.title ?? name;

	const setLinks = (
		nextLinks: SitePartBlock[],
		options?: { isTransient?: boolean }
	) =>
		setBlocks(
			replaceFirstBlock( blocks, SOCIAL_LINKS, ( block ) => ( {
				...block,
				innerBlocks: nextLinks,
			} ) ),
			options
		);

	// Typing is one undo step, made when the field loses focus.
	const setUrl = ( index: number, url: string ) =>
		setLinks(
			links.map( ( item, itemIndex ) =>
				itemIndex === index
					? { ...item, attributes: { ...item.attributes, url } }
					: item
			),
			{ isTransient: true }
		);

	const addableServices = services
		.filter(
			( service ) =>
				! links.some(
					( link ) => link.attributes.service === service.name
				)
		)
		.sort( ( a, b ) => a.title.localeCompare( b.title ) );

	return (
		<Stack direction="column" gap="lg">
			{ links.length === 0 && (
				<Text>{ __( 'No social icons yet. Add one below.' ) }</Text>
			) }
			{ links.map( ( link, index ) => {
				const title = getTitle( link.attributes.service );
				return (
					<InputControl
						key={ link.clientId ?? index }
						type="url"
						label={ title }
						placeholder="https://"
						value={ link.attributes.url ?? '' }
						onValueChange={ ( url ) => setUrl( index, url ) }
						onBlur={ commitBlocks }
						suffix={
							<InputLayout.Slot padding="minimal">
								<Button
									icon={ closeSmall }
									size="small"
									label={ sprintf(
										/* translators: %s: Social service name, e.g. "Instagram". */
										__( 'Remove %s' ),
										title
									) }
									onClick={ () =>
										setLinks(
											links.filter(
												( _item, itemIndex ) =>
													itemIndex !== index
											)
										)
									}
								/>
							</InputLayout.Slot>
						}
					/>
				);
			} ) }
			{ addableServices.length > 0 && (
				<SelectControl
					label={ __( 'Add a social icon' ) }
					placeholder={ __( 'Choose a service' ) }
					value={ null }
					items={ addableServices.map( ( service ) => ( {
						value: service.name,
						label: service.title,
					} ) ) }
					onValueChange={ ( item ) => {
						const service = item?.value;
						if ( ! service ) {
							return;
						}
						setLinks( [
							...links,
							createBlock( SOCIAL_LINK, {
								service,
							} ) as unknown as SitePartBlock,
						] );
					} }
				/>
			) }
		</Stack>
	);
}
