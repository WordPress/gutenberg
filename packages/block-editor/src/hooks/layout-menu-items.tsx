import { __, _x } from '@wordpress/i18n';
import {
	arrowDown,
	arrowRight,
	justifyBottom,
	justifyCenter,
	justifyCenterVertical,
	justifyLeft,
	justifyRight,
	justifySpaceBetween,
	justifySpaceBetweenVertical,
	justifyStretch,
	justifyStretchVertical,
	justifyTop,
} from '@wordpress/icons';
import {
	BlockOptionsMenuControls,
	BlockOptionsMenuItem,
} from '../components/block-toolbar/redesign/options-menu-item';
import type { BlockOptionsMenuChoice } from '../components/block-toolbar/redesign/options-menu-item';
import type { Layout, LayoutBlockSupport } from '../layouts/types';

const JUSTIFICATION_CHOICES: Record< string, BlockOptionsMenuChoice > = {
	left: {
		value: 'left',
		label: _x( 'Left', 'Content justification' ),
		icon: justifyLeft,
	},
	center: {
		value: 'center',
		label: _x( 'Center', 'Content justification' ),
		icon: justifyCenter,
	},
	right: {
		value: 'right',
		label: _x( 'Right', 'Content justification' ),
		icon: justifyRight,
	},
	'space-between': {
		value: 'space-between',
		label: __( 'Space between' ),
		icon: justifySpaceBetween,
	},
	stretch: {
		value: 'stretch',
		label: _x( 'Stretch', 'Content justification' ),
		icon: justifyStretch,
	},
};

const VERTICAL_ALIGNMENT_CHOICES: Record< string, BlockOptionsMenuChoice > = {
	top: {
		value: 'top',
		label: _x( 'Top', 'Block vertical alignment setting' ),
		icon: justifyTop,
	},
	center: {
		value: 'center',
		label: _x( 'Middle', 'Block vertical alignment setting' ),
		icon: justifyCenterVertical,
	},
	bottom: {
		value: 'bottom',
		label: _x( 'Bottom', 'Block vertical alignment setting' ),
		icon: justifyBottom,
	},
	stretch: {
		value: 'stretch',
		label: _x( 'Stretch', 'Block vertical alignment setting' ),
		icon: justifyStretchVertical,
	},
	'space-between': {
		value: 'space-between',
		label: __( 'Space between' ),
		icon: justifySpaceBetweenVertical,
	},
};

const ORIENTATION_CHOICES: BlockOptionsMenuChoice[] = [
	{ value: 'horizontal', label: __( 'Horizontal' ), icon: arrowRight },
	{ value: 'vertical', label: __( 'Vertical' ), icon: arrowDown },
];

/**
 * Adds a container's layout settings to the Layout menu of the redesigned
 * block toolbar, in place of the layout toolbar controls.
 *
 * @param props                    Component props.
 * @param props.layoutType         The name of the layout type.
 * @param props.layout             The layout in use.
 * @param props.layoutBlockSupport The layout support of the block.
 * @param props.onChange           Called with the new layout.
 */
export default function LayoutMenuItems( {
	layoutType,
	layout,
	layoutBlockSupport,
	onChange,
}: {
	layoutType: string;
	layout: Layout;
	layoutBlockSupport: LayoutBlockSupport;
	onChange: ( layout: Layout ) => void;
} ) {
	const {
		allowJustification = true,
		allowOrientation = true,
		allowVerticalAlignment = true,
	} = layoutBlockSupport;

	if ( layoutType === 'constrained' ) {
		if ( ! allowJustification ) {
			return null;
		}
		return (
			<BlockOptionsMenuControls>
				<BlockOptionsMenuItem
					group="layout"
					name="layout-justification"
					label={ __( 'Content' ) }
					choices={ [ 'left', 'center', 'right' ].map(
						( value ) => JUSTIFICATION_CHOICES[ value ]
					) }
					value={ layout.justifyContent ?? 'center' }
					onChange={ ( justifyContent ) =>
						onChange( { ...layout, justifyContent } )
					}
				/>
			</BlockOptionsMenuControls>
		);
	}

	if ( layoutType !== 'flex' ) {
		return null;
	}

	const { orientation = 'horizontal' } = layout;
	const isHorizontal = orientation === 'horizontal';
	const justifications = [
		'left',
		'center',
		'right',
		isHorizontal ? 'space-between' : 'stretch',
	];
	const verticalAlignments = isHorizontal
		? [ 'top', 'center', 'bottom', 'stretch' ]
		: [ 'top', 'center', 'bottom', 'space-between' ];

	return (
		<BlockOptionsMenuControls>
			{ allowJustification && (
				<BlockOptionsMenuItem
					group="layout"
					name="layout-justification"
					label={ __( 'Content' ) }
					choices={ justifications.map(
						( value ) => JUSTIFICATION_CHOICES[ value ]
					) }
					value={ layout.justifyContent ?? 'left' }
					onChange={ ( justifyContent ) =>
						onChange( { ...layout, justifyContent } )
					}
				/>
			) }
			{ allowOrientation && (
				<BlockOptionsMenuItem
					group="layout"
					name="layout-orientation"
					label={ __( 'Orientation' ) }
					choices={ ORIENTATION_CHOICES }
					value={ orientation }
					onChange={ ( nextOrientation ) => {
						// Keep the alignments compatible with the orientation.
						let { verticalAlignment, justifyContent } = layout;
						if ( nextOrientation === 'horizontal' ) {
							if ( verticalAlignment === 'space-between' ) {
								verticalAlignment = 'center';
							}
							if ( justifyContent === 'stretch' ) {
								justifyContent = 'left';
							}
						} else {
							if ( verticalAlignment === 'stretch' ) {
								verticalAlignment = 'top';
							}
							if ( justifyContent === 'space-between' ) {
								justifyContent = 'left';
							}
						}
						onChange( {
							...layout,
							orientation: nextOrientation,
							verticalAlignment,
							justifyContent,
						} );
					} }
				/>
			) }
			{ allowVerticalAlignment && (
				<BlockOptionsMenuItem
					group="layout"
					name="layout-vertical-alignment"
					label={ __( 'Vertical alignment' ) }
					choices={ verticalAlignments.map(
						( value ) => VERTICAL_ALIGNMENT_CHOICES[ value ]
					) }
					value={
						layout.verticalAlignment ??
						( isHorizontal ? 'center' : 'top' )
					}
					onChange={ ( verticalAlignment ) =>
						onChange( { ...layout, verticalAlignment } )
					}
				/>
			) }
		</BlockOptionsMenuControls>
	);
}
