/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import BlockBindingsFill from '../../components/block-bindings/bindings-ui';
import BlockBindingsFieldsList from '../../components/block-bindings/fields-list';

const SiteData = ( props ) => {
	const siteData = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		return getEntityRecord( 'root', 'site' );
	}, [] );

	// Adapt the data to the format expected by the fields list.
	// TODO: Ensure the key and label work with translations.
	const fields = [
		{
			key: 'blogname',
			label: 'Site title',
			value: siteData.title,
		},
		{
			key: 'blogdescription',
			label: 'Site description',
			value: siteData.description,
		},
		{
			key: 'siteurl',
			label: 'Site url',
			value: siteData.url,
		},
	];

	return (
		<BlockBindingsFieldsList
			fields={ fields }
			source="site_data"
			{ ...props }
		/>
	);
};

if ( window.__experimentalBlockBindings ) {
	const withCoreSources = createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { isSelected } = props;

			return (
				<>
					{ isSelected && (
						<>
							<BlockBindingsFill
								source="site_data"
								label="Site data"
							>
								<SiteData />
							</BlockBindingsFill>
						</>
					) }
					<BlockEdit key="edit" { ...props } />
				</>
			);
		},
		'withToolbarControls'
	);

	addFilter(
		'editor.BlockEdit',
		'core/block-bindings-ui/add-sources',
		withCoreSources
	);
}
