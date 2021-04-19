/**
 * External dependencies
 */
import { map, sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	PanelBody,
	TabPanel,
	__unstableComponentSystemProvider as ComponentSystemProvider,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	useGlobalStylesContext,
	useGlobalStylesReset,
} from '../editor/global-styles-provider';
import DefaultSidebar from './default-sidebar';
import { ROOT_BLOCK_NAME } from '../editor/utils';
import {
	default as TypographyPanel,
	useHasTypographyPanel,
} from './typography-panel';
import { default as BorderPanel, useHasBorderPanel } from './border-panel';
import { default as ColorPanel, useHasColorPanel } from './color-panel';
import { default as SpacingPanel, useHasSpacingPanel } from './spacing-panel';

function GlobalStylesPanel( {
	wrapperPanelTitle,
	context,
	getStyle,
	setStyle,
	getSetting,
	setSetting,
} ) {
	const hasBorderPanel = useHasBorderPanel( context );
	const hasColorPanel = useHasColorPanel( context );
	const hasTypographyPanel = useHasTypographyPanel( context );
	const hasSpacingPanel = useHasSpacingPanel( context );

	if ( ! hasColorPanel && ! hasTypographyPanel && ! hasSpacingPanel ) {
		return null;
	}

	const content = (
		<ComponentSystemProvider
			__unstableNextInclude={ [ 'WPComponentsFontSizePicker' ] }
		>
			{ hasTypographyPanel && (
				<TypographyPanel
					context={ context }
					getStyle={ getStyle }
					setStyle={ setStyle }
				/>
			) }
			{ hasColorPanel && (
				<ColorPanel
					context={ context }
					getStyle={ getStyle }
					setStyle={ setStyle }
					getSetting={ getSetting }
					setSetting={ setSetting }
				/>
			) }
			{ hasSpacingPanel && (
				<SpacingPanel
					context={ context }
					getStyle={ getStyle }
					setStyle={ setStyle }
				/>
			) }
			{ hasBorderPanel && (
				<BorderPanel
					context={ context }
					getStyle={ getStyle }
					setStyle={ setStyle }
				/>
			) }
		</ComponentSystemProvider>
	);
	if ( ! wrapperPanelTitle ) {
		return content;
	}
	return (
		<PanelBody title={ wrapperPanelTitle } initialOpen={ false }>
			{ content }
		</PanelBody>
	);
}

function getPanelTitle( context ) {
	/*
	 * We use the block's name as the panel title.
	 *
	 * Some blocks (eg: core/heading) can represent different
	 * contexts (eg: core/heading/h1, core/heading/h2).
	 * For those, we attach the selector (h1) after the block's name.
	 *
	 * The title can't be accessed in the server,
	 * as it's translatable and the block.json doesn't
	 * have it yet.
	 */
	const blockType = getBlockType( context.blockName );
	// Protect against blocks that aren't registered
	// eg: widget-area
	if ( blockType === undefined ) {
		return blockType;
	}

	let panelTitle = blockType.title;
	if ( context?.title ) {
		panelTitle += ` (${ context.title })`;
	}
	return panelTitle;
}

function GlobalStylesBlockPanels( {
	contexts,
	getStyle,
	setStyle,
	getSetting,
	setSetting,
} ) {
	const panels = useMemo(
		() =>
			sortBy(
				map( contexts, ( context, name ) => {
					return {
						context,
						name,
						wrapperPanelTitle: getPanelTitle( context ),
					};
				} ),
				( { wrapperPanelTitle } ) => wrapperPanelTitle
			),
		[ contexts ]
	);

	return map( panels, ( { context, name, wrapperPanelTitle } ) => {
		if ( name === ROOT_BLOCK_NAME ) {
			return null;
		}
		return (
			<GlobalStylesPanel
				key={ 'panel-' + name }
				wrapperPanelTitle={ wrapperPanelTitle }
				context={ { ...context, name } }
				getStyle={ getStyle }
				setStyle={ setStyle }
				getSetting={ getSetting }
				setSetting={ setSetting }
			/>
		);
	} );
}

export default function GlobalStylesSidebar( {
	identifier,
	title,
	icon,
	closeLabel,
} ) {
	const {
		contexts,
		getStyle,
		setStyle,
		getSetting,
		setSetting,
	} = useGlobalStylesContext();
	const [ canRestart, onReset ] = useGlobalStylesReset();

	if ( typeof contexts !== 'object' || ! contexts?.[ ROOT_BLOCK_NAME ] ) {
		// No sidebar is shown.
		return null;
	}

	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			identifier={ identifier }
			title={ title }
			icon={ icon }
			closeLabel={ closeLabel }
			header={
				<>
					<strong>{ title }</strong>
					<Button
						className="edit-site-global-styles-sidebar__reset-button"
						isSmall
						isTertiary
						disabled={ ! canRestart }
						onClick={ onReset }
					>
						{ __( 'Reset to defaults' ) }
					</Button>
				</>
			}
		>
			<TabPanel
				tabs={ [
					{ name: 'root', title: __( 'Root' ) },
					{ name: 'block', title: __( 'By Block Type' ) },
				] }
			>
				{ ( tab ) => {
					/* Per Block Context */
					if ( 'block' === tab.name ) {
						return (
							<GlobalStylesBlockPanels
								contexts={ contexts }
								getStyle={ getStyle }
								setStyle={ setStyle }
								getSetting={ getSetting }
								setSetting={ setSetting }
							/>
						);
					}
					return (
						<GlobalStylesPanel
							hasWrapper={ false }
							context={ {
								...contexts[ ROOT_BLOCK_NAME ],
								name: ROOT_BLOCK_NAME,
							} }
							getStyle={ getStyle }
							setStyle={ setStyle }
							getSetting={ getSetting }
							setSetting={ setSetting }
						/>
					);
				} }
			</TabPanel>
		</DefaultSidebar>
	);
}
