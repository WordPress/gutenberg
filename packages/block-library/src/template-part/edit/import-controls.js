/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useSelect, useRegistry } from '@wordpress/data';
import { Button, SelectControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useCreateTemplatePartFromBlocks } from './utils/hooks';
import { transformWidgetToBlock } from './utils/transformers';

export function TemplatePartImportControls( { area, setAttributes } ) {
	const [ selectedSidebar, setSelectedSidebar ] = useState( '' );
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
			.filter( ( widgetArea ) => widgetArea.widgets.length > 0 )
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
			{ value: '', label: __( 'Select widget area' ) },
			...sidebarOptions,
		];
	}, [ sidebars ] );

	if ( ! options.length ) {
		return null;
	}

	async function createFromWidgets( event ) {
		event.preventDefault();

		if ( isBusy || ! selectedSidebar ) {
			return;
		}

		setIsBusy( true );

		const sidebar = options.find(
			( { value } ) => value === selectedSidebar
		);
		const { getWidgets } = registry.resolveSelect( coreStore );

		// The widgets API always returns a successful response.
		const widgets = await getWidgets( {
			sidebar: sidebar.value,
			_embed: 'about',
		} );
		const blocks = widgets.map( transformWidgetToBlock );

		await createFromBlocks(
			blocks,
			/* translators: %s: name of the widget area */
			sprintf( __( 'Widget area: %s' ), sidebar.label )
		);

		setIsBusy( false );
	}

	return (
		<form onSubmit={ createFromWidgets }>
			<SelectControl
				label={ __( 'Import widget area' ) }
				value={ selectedSidebar }
				options={ options }
				onChange={ ( value ) => setSelectedSidebar( value ) }
			/>
			<Button
				variant="primary"
				type="submit"
				isBusy={ isBusy }
				aria-disabled={ isBusy || ! selectedSidebar }
			>
				{ __( 'Import' ) }
			</Button>
		</form>
	);
}
