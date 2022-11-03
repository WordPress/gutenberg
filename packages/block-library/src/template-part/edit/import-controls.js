/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useSelect, useRegistry } from '@wordpress/data';
import { InspectorControls } from '@wordpress/block-editor';
import { Button, PanelBody, SelectControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useCreateTemplatePartFromBlocks } from './utils/hooks';
import { transformWidgetToBlock } from './utils/transformers';

export function TemplateParetImportControls( { area, setAttributes } ) {
	const [ sidebar, setSidebar ] = useState( '' );
	const [ isBusy, setIsBusy ] = useState( false );

	const registry = useRegistry();
	const sidebars = useSelect( ( select ) => {
		return select( coreStore ).getSidebars( {
			per_page: -1,
			_fields: 'id,name,description,status,widgets',
		} );
	}, [] );

	const createFromBlocks = useCreateTemplatePartFromBlocks(
		area,
		setAttributes
	);

	const options = useMemo( () => {
		const sidebarOptions = ( sidebars ?? [] )
			.filter(
				( widgetArea ) =>
					widgetArea.status === 'active' &&
					widgetArea.widgets.length > 0
			)
			.map( ( widgetArea ) => {
				return {
					value: widgetArea.id,
					label: widgetArea.name,
				};
			} );

		if ( ! sidebarOptions.length ) {
			return [];
		}

		return [
			{ value: '', label: __( 'Select sidebar' ) },
			...sidebarOptions,
		];
	}, [ sidebars ] );

	if ( ! options.length ) {
		return null;
	}

	async function createFromWidgets( event ) {
		event.preventDefault();

		if ( isBusy || ! sidebar ) {
			return;
		}

		setIsBusy( true );

		const { getWidgets } = registry.resolveSelect( coreStore );

		const widgets = await getWidgets( {
			sidebar,
			_embed: 'about',
		} );
		const blocks = widgets.map( transformWidgetToBlock );

		await createFromBlocks( blocks, sidebar );

		setIsBusy( false );
	}

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Import' ) }>
				<form onSubmit={ createFromWidgets }>
					<SelectControl
						label={ __( 'Widget areas' ) }
						value={ sidebar }
						options={ options }
						onChange={ ( value ) => setSidebar( value ) }
						hideLabelFromVision
						__next36pxDefaultSize
					/>
					<Button
						variant="primary"
						type="submit"
						isBusy={ isBusy }
						aria-disabled={ isBusy || ! sidebar }
					>
						{ __( 'Import' ) }
					</Button>
				</form>
			</PanelBody>
		</InspectorControls>
	);
}
