/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal, SearchControl, Spinner } from '@wordpress/components';
import { Stack, Tabs } from '@wordpress/ui';
import { useState, useMemo } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import IconGrid from './icon-grid';
import { normalizeSearchInput } from '../../../utils/search-patterns';

export default function CustomInserterModal( { onClose, value, onChange } ) {
	const [ searchInput, setSearchInput ] = useState( '' );
	const [ currentCollection, setCurrentCollection ] = useState( null );

	const debouncedSetSearchInput = useDebounce( setSearchInput, 300 );

	const collections = useSelect(
		( select ) =>
			select( coreDataStore ).getEntityRecords(
				'root',
				'iconCollection'
			),
		[]
	);

	// Default to the collection the selected icon belongs to, otherwise the
	// first collection.
	const selectedCollection = value?.split( '/' )[ 0 ];
	const collectionSlug =
		currentCollection ??
		( collections?.some( ( { slug } ) => slug === selectedCollection )
			? selectedCollection
			: collections?.[ 0 ]?.slug ) ??
		null;

	const { icons, hasResolvedIcons } = useSelect(
		( select ) => {
			if ( collectionSlug === null ) {
				return { icons: null, hasResolvedIcons: false };
			}
			const query =
				collectionSlug === '' ? {} : { collection: collectionSlug };
			const { getEntityRecords, hasFinishedResolution } =
				select( coreDataStore );
			return {
				icons: getEntityRecords( 'root', 'icon', query ),
				hasResolvedIcons: hasFinishedResolution( 'getEntityRecords', [
					'root',
					'icon',
					query,
				] ),
			};
		},
		[ collectionSlug ]
	);

	const filteredIcons = useMemo( () => {
		if ( ! icons ) {
			return [];
		}
		if ( searchInput ) {
			const input = normalizeSearchInput( searchInput );
			return icons.filter( ( icon ) => {
				const iconName = normalizeSearchInput( icon.name );
				const iconLabel = normalizeSearchInput( icon.label );

				return (
					iconName.includes( input ) || iconLabel.includes( input )
				);
			} );
		}

		return icons;
	}, [ searchInput, icons ] );

	return (
		<Modal
			className="wp-block-icon__inserter-modal"
			title={ __( 'Icon library' ) }
			onRequestClose={ onClose }
			isFullScreen
		>
			<Tabs.Root
				className="wp-block-icon__inserter"
				orientation="vertical"
				value={ collectionSlug }
				onValueChange={ setCurrentCollection }
			>
				<Stack
					direction="column"
					gap="lg"
					className="wp-block-icon__inserter-sidebar"
				>
					<SearchControl
						value={ searchInput }
						onChange={ debouncedSetSearchInput }
					/>
					<Tabs.List>
						<Tabs.Tab value="">{ __( 'All' ) }</Tabs.Tab>
						{ collections?.map( ( collection ) => (
							<Tabs.Tab
								key={ collection.slug }
								value={ collection.slug }
							>
								{ collection.label }
							</Tabs.Tab>
						) ) }
					</Tabs.List>
				</Stack>
				{ [ { slug: '' }, ...( collections ?? [] ) ].map(
					( collection ) => (
						<Tabs.Panel
							tabIndex={ -1 }
							key={ collection.slug }
							value={ collection.slug }
							className="wp-block-icon__inserter-panel"
						>
							{ ! hasResolvedIcons ? (
								<div
									className="wp-block-icon__inserter-loading"
									role="status"
									aria-label={ __( 'Loading…' ) }
								>
									<Spinner />
								</div>
							) : (
								<IconGrid
									icons={ filteredIcons }
									onChange={ onChange }
									value={ value }
								/>
							) }
						</Tabs.Panel>
					)
				) }
			</Tabs.Root>
		</Modal>
	);
}
