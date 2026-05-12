/**
 * Internal dependencies
 */
import { computeSelectionVisual } from '../compute-selection';
import { getCursorPosition } from '../cursor-dom-utils';

jest.mock( '@wordpress/core-data', () => ( {
	SelectionDirection: {
		Backward: 'backward',
		Forward: 'forward',
	},
	SelectionType: {
		None: 'none',
		Cursor: 'cursor',
		SelectionInOneBlock: 'selection-in-one-block',
		SelectionInMultipleBlocks: 'selection-in-multiple-blocks',
		WholeBlock: 'whole-block',
	},
} ) );

jest.mock( '../cursor-dom-utils', () => ( {
	getCursorPosition: jest.fn( () => ( {
		x: 10,
		y: 20,
		height: 30,
	} ) ),
	getSelectionRects: jest.fn( () => [] ),
	getFullBlockSelectionRects: jest.fn( () => [] ),
	getBlocksBetween: jest.fn( () => [] ),
	isNodeBefore: jest.fn( () => false ),
} ) );

const mockGetCursorPosition = getCursorPosition as jest.Mock;
const SelectionType = {
	Cursor: 'cursor',
} as const;

type ResolvedSelection = {
	richTextOffset: number | null;
	localClientId: string | null;
	attributeKey: string | null;
};

function createOverlayContext( bodyHtml: string ) {
	document.body.innerHTML = bodyHtml;

	return {
		editorDocument: document,
		overlayRect: {
			left: 0,
			top: 0,
			right: 100,
			bottom: 100,
			width: 100,
			height: 100,
			x: 0,
			y: 0,
			toJSON: () => ( {} ),
		} as DOMRect,
	};
}

describe( 'computeSelectionVisual', () => {
	beforeAll( () => {
		Object.defineProperty( globalThis, 'CSS', {
			configurable: true,
			value: {
				escape: ( value: string ) => value,
			},
		} );
	} );

	beforeEach( () => {
		mockGetCursorPosition.mockClear();
	} );

	it( 'anchors cursor selections to the matching nested RichText element', () => {
		const overlayContext = createOverlayContext(
			'<div data-block="block-1">' +
				'<div data-wp-block-attribute-key="body.0.cells.0.content">Alpha</div>' +
				'<div data-wp-block-attribute-key="body.0.cells.1.content">Beta</div>' +
				'</div>'
		);

		const start: ResolvedSelection = {
			richTextOffset: 2,
			localClientId: 'block-1',
			attributeKey: 'body.0.cells.1.content',
		};

		computeSelectionVisual(
			{ type: SelectionType.Cursor },
			start,
			undefined,
			overlayContext
		);

		const targetElement = document.querySelector(
			'[data-wp-block-attribute-key="body.0.cells.1.content"]'
		);

		expect( mockGetCursorPosition ).toHaveBeenCalledWith(
			2,
			targetElement,
			document,
			overlayContext.overlayRect
		);
	} );

	it( 'does not fall back to the whole block for a missing keyed RichText target', () => {
		const overlayContext = createOverlayContext(
			'<div data-block="block-1">' +
				'<div data-wp-block-attribute-key="body.0.cells.0.content">Alpha</div>' +
				'</div>'
		);

		const start: ResolvedSelection = {
			richTextOffset: 2,
			localClientId: 'block-1',
			attributeKey: 'body.1.cells.0.content',
		};

		const result = computeSelectionVisual(
			{ type: SelectionType.Cursor },
			start,
			undefined,
			overlayContext
		);

		expect( result.coords ).toBeUndefined();
		expect( mockGetCursorPosition ).not.toHaveBeenCalled();
	} );
} );
