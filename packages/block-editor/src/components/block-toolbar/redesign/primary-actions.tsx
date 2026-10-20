import type { ComponentType } from 'react';
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	Button,
	Icon as WCIcon,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import {
	getBlockSupport,
	getBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import { chevronDown, plus } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import _Inserter from '../../inserter';
import { store as blockEditorStore } from '../../../store';
import { isLayoutVariation } from './utils';

// The inserter's JSDoc marks every prop as required.
const Inserter = _Inserter as unknown as ComponentType< any >;

type Layout = {
	type?: string;
	orientation?: string;
	justifyContent?: string;
	verticalAlignment?: string;
};

type LayoutSupport =
	| boolean
	| {
			default?: Layout;
			allowEditing?: boolean;
			allowJustification?: boolean;
			allowVerticalAlignment?: boolean;
	  };

type Variation = {
	name: string;
	title: string;
	attributes?: Record< string, unknown >;
};

const EMPTY_OBJECT: Record< string, any > = {};

const JUSTIFY_LABELS: Record< string, string > = {
	left: __( 'Left' ),
	center: __( 'Center' ),
	right: __( 'Right' ),
	'space-between': __( 'Space between' ),
	stretch: __( 'Stretch' ),
};

const VERTICAL_ALIGNMENT_LABELS: Record< string, string > = {
	top: __( 'Top' ),
	center: __( 'Middle' ),
	bottom: __( 'Bottom' ),
};

/**
 * Returns the justification options a layout offers.
 *
 * @param layout The block's layout.
 * @return Justification values, or none.
 */
function getJustifyOptions( layout: Layout ): string[] {
	if ( layout.type === 'flex' ) {
		return layout.orientation === 'vertical'
			? [ 'left', 'center', 'right', 'stretch' ]
			: [ 'left', 'center', 'right', 'space-between' ];
	}
	if ( layout.type === 'constrained' ) {
		return [ 'left', 'center', 'right' ];
	}
	return [];
}

function useContainer( clientId: string ) {
	return useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockAttributes,
				getBlockListSettings,
				getTemplateLock,
				getBlockEditingMode,
				hasInserterItems,
			} = select( blockEditorStore );
			const { getBlockVariations, getActiveBlockVariation } =
				select( blocksStore );
			const name = getBlockName( clientId ) ?? '';
			const attributes = getBlockAttributes( clientId ) ?? EMPTY_OBJECT;
			const layoutSupport = getBlockSupport( name, 'layout' ) as
				LayoutSupport | undefined;
			const templateLock = getTemplateLock( clientId );
			const canEditLayout =
				!! layoutSupport &&
				( typeof layoutSupport !== 'object' ||
					layoutSupport.allowEditing !== false ) &&
				getBlockEditingMode( clientId ) === 'default';
			return {
				name,
				attributes,
				layoutSupport: layoutSupport || undefined,
				canEditLayout,
				variations: canEditLayout
					? getBlockVariations( name, 'transform' )
					: undefined,
				activeVariation: getActiveBlockVariation( name, attributes ),
				// Containers render inner blocks, which gives them list
				// settings.
				canInsertInside:
					!! getBlockListSettings( clientId ) &&
					templateLock !== 'all' &&
					templateLock !== 'insert' &&
					hasInserterItems( clientId ),
			};
		},
		[ clientId ]
	);
}

function LayoutMenu( {
	clientId,
	attributes,
	layoutSupport,
	layoutVariations,
	activeVariation,
}: {
	clientId: string;
	attributes: Record< string, any >;
	layoutSupport?: LayoutSupport;
	layoutVariations?: Variation[];
	activeVariation?: Variation;
} ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const layout: Layout = {
		...( typeof layoutSupport === 'object'
			? layoutSupport.default
			: undefined ),
		...attributes.layout,
	};
	const allowJustification =
		typeof layoutSupport !== 'object' ||
		layoutSupport.allowJustification !== false;
	const allowVerticalAlignment =
		typeof layoutSupport !== 'object' ||
		layoutSupport.allowVerticalAlignment !== false;
	const justifyOptions = allowJustification
		? getJustifyOptions( layout )
		: [];
	const showVerticalAlignment =
		allowVerticalAlignment &&
		layout.type === 'flex' &&
		layout.orientation !== 'vertical';
	const hasVariations = !! layoutVariations && layoutVariations.length > 1;

	if ( ! hasVariations && ! justifyOptions.length ) {
		return null;
	}

	const setLayout = ( changes: Layout ) =>
		updateBlockAttributes( clientId, {
			layout: { ...attributes.layout, ...changes },
		} );

	const justifyValue = layout.justifyContent ?? 'left';
	const verticalValue = layout.verticalAlignment ?? 'center';

	return (
		<Menu.Root>
			<ToolbarItem>
				{ ( itemProps ) => (
					<Menu.Trigger
						render={
							<Button
								{ ...itemProps }
								__next40pxDefaultSize
								className="block-editor-block-toolbar-redesign__text-button"
							/>
						}
					>
						{ __( 'Layout' ) }
						<WCIcon icon={ chevronDown } size={ 16 } />
					</Menu.Trigger>
				) }
			</ToolbarItem>
			<Menu.Popup
				className="block-editor-block-toolbar-redesign__menu"
				positioner={ <Menu.Positioner side="bottom" align="start" /> }
			>
				{ hasVariations && (
					<Menu.RadioGroup
						value={ activeVariation?.name ?? null }
						onValueChange={ ( variationName ) => {
							const variation = layoutVariations?.find(
								( { name } ) => name === variationName
							);
							if ( variation ) {
								updateBlockAttributes(
									clientId,
									variation.attributes ?? {}
								);
							}
						} }
					>
						{ layoutVariations?.map( ( variation ) => (
							<Menu.RadioItem
								key={ variation.name }
								value={ variation.name }
							>
								<Menu.ItemLabel>
									{ variation.title }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						) ) }
					</Menu.RadioGroup>
				) }
				{ hasVariations && !! justifyOptions.length && (
					<Menu.Separator />
				) }
				{ !! justifyOptions.length && (
					<Menu.SubmenuRoot>
						<Menu.SubmenuTrigger
							suffix={ JUSTIFY_LABELS[ justifyValue ] }
						>
							<Menu.ItemLabel>{ __( 'Justify' ) }</Menu.ItemLabel>
						</Menu.SubmenuTrigger>
						<Menu.Popup className="block-editor-block-toolbar-redesign__menu">
							<Menu.RadioGroup
								value={ justifyValue }
								onValueChange={ ( justifyContent ) =>
									setLayout( { justifyContent } )
								}
							>
								{ justifyOptions.map( ( value ) => (
									<Menu.RadioItem
										key={ value }
										value={ value }
									>
										<Menu.ItemLabel>
											{ JUSTIFY_LABELS[ value ] }
										</Menu.ItemLabel>
									</Menu.RadioItem>
								) ) }
							</Menu.RadioGroup>
						</Menu.Popup>
					</Menu.SubmenuRoot>
				) }
				{ showVerticalAlignment && (
					<Menu.SubmenuRoot>
						<Menu.SubmenuTrigger
							suffix={
								VERTICAL_ALIGNMENT_LABELS[ verticalValue ]
							}
						>
							<Menu.ItemLabel>
								{ __( 'Vertical alignment' ) }
							</Menu.ItemLabel>
						</Menu.SubmenuTrigger>
						<Menu.Popup className="block-editor-block-toolbar-redesign__menu">
							<Menu.RadioGroup
								value={ verticalValue }
								onValueChange={ ( verticalAlignment ) =>
									setLayout( { verticalAlignment } )
								}
							>
								{ Object.entries(
									VERTICAL_ALIGNMENT_LABELS
								).map( ( [ value, label ] ) => (
									<Menu.RadioItem
										key={ value }
										value={ value }
									>
										<Menu.ItemLabel>
											{ label }
										</Menu.ItemLabel>
									</Menu.RadioItem>
								) ) }
							</Menu.RadioGroup>
						</Menu.Popup>
					</Menu.SubmenuRoot>
				) }
			</Menu.Popup>
		</Menu.Root>
	);
}

function InsertInside( {
	clientId,
	blockTitle,
}: {
	clientId: string;
	blockTitle?: string;
} ) {
	return (
		<Inserter
			position="bottom right"
			rootClientId={ clientId }
			isAppender
			__experimentalIsQuick
			renderToggle={ ( {
				onToggle,
				isOpen,
				disabled,
				blockTitle: onlyBlockTitle,
				hasSingleBlockType,
			}: {
				onToggle: () => void;
				isOpen: boolean;
				disabled: boolean;
				blockTitle: string;
				hasSingleBlockType: boolean;
			} ) => (
				<ToolbarButton
					className="block-editor-block-toolbar-redesign__insert-inside"
					onClick={ onToggle }
					aria-expanded={ isOpen }
					disabled={ disabled }
					label={
						hasSingleBlockType
							? sprintf(
									// translators: %s: the name of the only block that can be added.
									_x(
										'Add %s',
										'directly add the only allowed block'
									),
									onlyBlockTitle.toLowerCase()
								)
							: sprintf(
									// translators: %s: the name of the container block, e.g. "Group".
									__( 'Add block inside %s' ),
									blockTitle ?? ''
								)
					}
					showTooltip
					icon={ plus }
				/>
			) }
		/>
	);
}

/**
 * The primary actions slot: the few structural actions a block keeps on the
 * toolbar. Containers get a labelled Layout button and a `+` that adds a
 * block inside them. Most other blocks leave it empty.
 *
 * @param props          Component props.
 * @param props.clientId Selected block.
 */
export default function PrimaryActions( { clientId }: { clientId: string } ) {
	const {
		name,
		attributes,
		layoutSupport,
		canEditLayout,
		variations,
		activeVariation,
		canInsertInside,
	} = useContainer( clientId );
	const layoutVariations = useMemo(
		() =>
			( variations as Variation[] | undefined )?.filter(
				isLayoutVariation
			),
		[ variations ]
	);

	if ( ! canEditLayout && ! canInsertInside ) {
		return null;
	}

	return (
		<ToolbarGroup className="block-editor-block-toolbar-redesign__primary">
			{ canEditLayout && (
				<LayoutMenu
					clientId={ clientId }
					attributes={ attributes }
					layoutSupport={ layoutSupport }
					layoutVariations={ layoutVariations }
					activeVariation={ activeVariation as Variation | undefined }
				/>
			) }
			{ canInsertInside && (
				<InsertInside
					clientId={ clientId }
					blockTitle={ getBlockType( name )?.title }
				/>
			) }
		</ToolbarGroup>
	);
}
