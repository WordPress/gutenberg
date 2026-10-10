import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { appendSelectors } from './utils';
import { cleanEmptyObject } from '../hooks/utils';
import {
	DEFAULT_CANVAS_HEIGHT,
	DESIGN_WIDTH,
} from '../components/freeform/constants';

export default {
	name: 'freeform',
	label: __( 'Freeform' ),
	hasInspectorControls() {
		return true;
	},
	inspectorControls: function FreeformLayoutInspectorControls( {
		layout = {},
		onChange,
		resetLayout = {},
		clientId,
	} ) {
		const canvasHeight = layout.canvasHeight ?? DEFAULT_CANVAS_HEIGHT;
		const hasCanvasHeightValue = () =>
			canvasHeight !==
			( resetLayout?.canvasHeight ?? DEFAULT_CANVAS_HEIGHT );

		return (
			<ToolsPanelItem
				label={ __( 'Canvas height' ) }
				hasValue={ hasCanvasHeightValue }
				onDeselect={ () =>
					onChange(
						cleanEmptyObject( {
							...layout,
							canvasHeight: resetLayout?.canvasHeight,
						} )
					)
				}
				isShownByDefault
				panelId={ clientId }
			>
				<UnitControl
					label={ __( 'Canvas height' ) }
					help={ __(
						'The height of the canvas relative to its width. Blocks keep their position and proportion as the canvas is resized.'
					) }
					value={ `${ canvasHeight }px` }
					units={ [ { value: 'px', label: 'px', default: 0 } ] }
					min={ 100 }
					onChange={ ( next ) => {
						const parsed = parseFloat( next );
						onChange( {
							...layout,
							canvasHeight: isNaN( parsed )
								? undefined
								: Math.max( 100, Math.round( parsed ) ),
						} );
					} }
				/>
			</ToolsPanelItem>
		);
	},
	toolBarControls: function FreeformLayoutToolbarControls() {
		return null;
	},
	getLayoutStyle: function getLayoutStyle( {
		selector,
		layout = {},
		viewportOverrides,
	} ) {
		const effectiveLayout =
			viewportOverrides !== undefined
				? { ...layout, ...viewportOverrides }
				: layout;
		const { canvasHeight = DEFAULT_CANVAS_HEIGHT } = effectiveLayout;

		// Check that the layout attributes are of the correct type, so that we
		// don't accidentally write code that stores a string attribute instead
		// of a number.
		if ( process.env.NODE_ENV === 'development' ) {
			if ( canvasHeight && typeof canvasHeight !== 'number' ) {
				throw new Error( 'canvasHeight must be a number' );
			}
		}

		// The canvas is sized by ratio rather than by a fixed height, so a
		// layout authored at the design width keeps its proportions at every
		// rendered width. Children are positioned in percentages of this box,
		// which means one rule scales the whole canvas.
		//
		// Block gap is deliberately absent: on a canvas, the gap between two
		// blocks is wherever they were put.
		// `:is(*, div)` instead of a bare `*` raises the child selector's
		// specificity by 001, the same trick the grid layout uses. Without it
		// this ties with `.block-editor-block-list__block`, which sets
		// `position: relative`, and source order decides who wins — so blocks
		// stayed in flow depending on the order the styles happened to be
		// injected in.
		return (
			`${ appendSelectors( selector ) } { ` +
			`position: relative; ` +
			`aspect-ratio: ${ DESIGN_WIDTH } / ${ canvasHeight }; }` +
			`${ appendSelectors( selector, '> :is(*, div)' ) } { ` +
			`position: absolute; margin: 0; }`
		);
	},
	getOrientation() {
		// Nothing flows, so no axis is the one blocks follow. Callers that
		// branch on orientation treat anything they don't recognise as having
		// no meaningful direction, which is exactly right here.
		return 'freeform';
	},
	getAlignments() {
		// Alignment is meaningless when every child sets its own position.
		return [];
	},
};
