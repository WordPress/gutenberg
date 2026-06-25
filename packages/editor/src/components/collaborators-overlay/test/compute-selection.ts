/**
 * Internal dependencies
 */
import { computeSelectionVisual } from '../compute-selection';
import { getCursorPosition, getSelectionRects } from '../cursor-dom-utils';

jest.mock( '@wordpress/core-data', () => {
	const { __dangerousOptInToUnstableAPIsOnlyForCoreModules } =
		jest.requireActual( '@wordpress/private-apis' );
	const { lock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
		'@wordpress/core-data'
	);
	const privateApis = {};
	lock( privateApis, {
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
	} );

	return { privateApis };
} );

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
const mockGetSelectionRects = getSelectionRects as jest.Mock;
const SelectionType = {
	Cursor: 'cursor',
	SelectionInOneBlock: 'selection-in-one-block',
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
		mockGetSelectionRects.mockClear();
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

	it( 'anchors cursor selections to a keyed RichText block root', () => {
		const overlayContext = createOverlayContext(
			'<p data-block="block-1" data-wp-block-attribute-key="content">Alpha</p>'
		);

		const start: ResolvedSelection = {
			richTextOffset: 2,
			localClientId: 'block-1',
			attributeKey: 'content',
		};

		computeSelectionVisual(
			{ type: SelectionType.Cursor },
			start,
			undefined,
			overlayContext
		);

		const targetElement = document.querySelector(
			'[data-block="block-1"]'
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

	it( 'renders a same-block selection across different nested RichText elements', () => {
		const overlayContext = createOverlayContext(
			'<div data-block="block-1">' +
				'<div data-wp-block-attribute-key="body.0.cells.1.content">Beta start text</div>' +
				'<div data-wp-block-attribute-key="body.1.cells.1.content">Delta end text</div>' +
				'</div>'
		);
		const startElement = document.querySelector(
			'[data-wp-block-attribute-key="body.0.cells.1.content"]'
		);
		const endElement = document.querySelector(
			'[data-wp-block-attribute-key="body.1.cells.1.content"]'
		);
		const startRect = { x: 10, y: 10, width: 30, height: 12 };
		const endRect = { x: 10, y: 40, width: 30, height: 12 };
		mockGetSelectionRects
			.mockReturnValueOnce( [ startRect ] )
			.mockReturnValueOnce( [ endRect ] );

		const start: ResolvedSelection = {
			richTextOffset: 4,
			localClientId: 'block-1',
			attributeKey: 'body.0.cells.1.content',
		};
		const end: ResolvedSelection = {
			richTextOffset: 8,
			localClientId: 'block-1',
			attributeKey: 'body.1.cells.1.content',
		};

		const result = computeSelectionVisual(
			{ type: SelectionType.SelectionInOneBlock },
			start,
			end,
			overlayContext
		);

		expect( mockGetSelectionRects ).toHaveBeenNthCalledWith(
			1,
			startElement,
			4,
			Number.MAX_SAFE_INTEGER,
			document,
			overlayContext.overlayRect
		);
		expect( mockGetSelectionRects ).toHaveBeenNthCalledWith(
			2,
			endElement,
			0,
			8,
			document,
			overlayContext.overlayRect
		);
		expect( mockGetCursorPosition ).toHaveBeenCalledWith(
			8,
			endElement,
			document,
			overlayContext.overlayRect
		);
		expect( result.selectionRects ).toEqual( [ startRect, endRect ] );
	} );
} );
