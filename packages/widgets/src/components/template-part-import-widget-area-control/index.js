/**
 * External dependencies
 */
import { paramCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import {
	Button,
	FlexBlock,
	FlexItem,
	SelectControl,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { transformWidgetToBlock } from '../../utils';
import legacyWidgetTransforms from '../../blocks/legacy-widget/transforms';

export default function TemplatePartImportWidgetAreaControl( {
	area,
	setAttributes,
} ) {
	const [ selectedSidebar, setSelectedSidebar ] = useState( '' );
	const [ isBusy, setIsBusy ] = useState( false );

	const registry = useRegistry();
	const sidebars = useSelect( ( select ) => {
		return select( coreStore ).getSidebars( {
			per_page: -1,
			_fields: 'id,name,description,status,widgets',
		} );
	}, [] );
	const { createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );

	const options = useMemo( () => {
		const sidebarOptions = ( sidebars ?? [] )
			.filter(
				( widgetArea ) =>
					widgetArea.id !== 'wp_inactive_widgets' &&
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
			{ value: '', label: __( 'Select widget area' ) },
			...sidebarOptions,
		];
	}, [ sidebars ] );

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

		const skippedWidgets = new Set();
		const blocks = widgets.flatMap( ( widget ) => {
			if ( widget.id_base === 'block' ) {
				return transformWidgetToBlock( widget );
			}

			const attributes = {
				idBase: widget.id_base,
				instance: widget.instance,
			};

			const transform = legacyWidgetTransforms.to.find( ( { isMatch } ) =>
				isMatch( attributes )
			);

			// Skip the block if we have no matching transformations.
			if ( ! transform ) {
				skippedWidgets.add( widget.id_base );
				return [];
			}

			return transform.transform( attributes );
		} );

		// TODO: Is all of this necessary? Borrowed it from useCreateTemplatePartFromBlocks().
		const title = sprintf(
			/* translators: %s: name of the widget area */
			__( 'Widget area: %s' ),
			sidebar.label
		);
		const record = {
			title,
			slug: paramCase( title ).replace( /[^\w-]+/g, '' ),
			content: serialize( blocks ),
			area,
		};
		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			record
		);
		setAttributes( {
			slug: templatePart.slug,
			theme: templatePart.theme,
			area: undefined,
		} );

		if ( skippedWidgets.size ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: the list of widgets */
					__( 'Unable to import the following widgets: %s.' ),
					Array.from( skippedWidgets ).join( ', ' )
				),
				{
					type: 'snackbar',
				}
			);
		}

		setIsBusy( false );
	}

	return (
		<Spacer marginBottom="4">
			<HStack as="form" onSubmit={ createFromWidgets }>
				<FlexBlock>
					<SelectControl
						label={ __( 'Import widget area' ) }
						value={ selectedSidebar }
						options={ options }
						onChange={ ( value ) => setSelectedSidebar( value ) }
						disabled={ ! options.length }
						__next36pxDefaultSize
						__nextHasNoMarginBottom
					/>
				</FlexBlock>
				<FlexItem
					style={ {
						marginBottom: '8px',
						marginTop: 'auto',
					} }
				>
					<Button
						variant="primary"
						type="submit"
						isBusy={ isBusy }
						aria-disabled={ isBusy || ! selectedSidebar }
					>
						{ __( 'Import' ) }
					</Button>
				</FlexItem>
			</HStack>
		</Spacer>
	);
}
