import { useSelect } from '@wordpress/data';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { store as coreStore, useEntityBlockEditor } from '@wordpress/core-data';
import { unlock } from '../../lock-unlock';
import {
	getSitePartContents,
	type SitePartBlock,
	type SitePartContents,
} from './get-site-part-contents';

const TEMPLATE_PART_POST_TYPE = 'wp_template_part';
const EMPTY_ARRAY: never[] = [];

export interface SitePartsUsage {
	parts: Record<
		string,
		{ area: string; templates: string[]; parents: string[] }
	>;
	primary: Record< string, string | null >;
}

export interface SitePartInUse {
	id: string;
	templates: string[];
}

/**
 * Which template parts the site uses, and the primary part in each area.
 *
 * @return The usage, or `null` while it loads.
 */
export function useSitePartsUsage(): SitePartsUsage | null {
	return useSelect(
		( select ) => unlock( select( coreStore ) ).getSitePartsUsage(),
		[]
	);
}

/**
 * Lists the parts in an area that templates use, the primary part first.
 *
 * @param usage The site parts usage.
 * @param area  The template part area.
 * @return The parts in use, with the templates that use each one.
 */
export function getPartsInUse(
	usage: SitePartsUsage | null,
	area: string
): SitePartInUse[] {
	if ( ! usage ) {
		return EMPTY_ARRAY;
	}
	const primary = usage.primary[ area ];
	return Object.entries( usage.parts )
		.filter(
			( [ , part ] ) => part.area === area && part.templates.length > 0
		)
		.map( ( [ id, part ] ) => ( { id, templates: part.templates } ) )
		.sort( ( a, b ) => {
			if ( a.id === primary ) {
				return -1;
			}
			if ( b.id === primary ) {
				return 1;
			}
			return b.templates.length - a.templates.length;
		} );
}

export interface UseSitePartResult {
	/** Whether the usage is still loading. */
	isResolving: boolean;
	/** The primary part's id, or `null` when the area has none. */
	partId: string | null;
	/** The primary part's record, with its edits. */
	record: Record< string, any > | null;
	/** The parts in the area that templates use, the primary part first. */
	partsInUse: SitePartInUse[];
	/** The primary part's blocks, with its edits. */
	blocks: SitePartBlock[];
	/** What the primary part holds. */
	contents: SitePartContents;
	/**
	 * Replaces the primary part's blocks, as an undoable edit. A transient
	 * edit, such as a keystroke, joins the next undo level instead of making
	 * its own; call `commitBlocks` once the user is done.
	 */
	setBlocks: (
		blocks: SitePartBlock[],
		options?: { isTransient?: boolean }
	) => void;
	/** Ends a run of transient edits with an undo level. */
	commitBlocks: () => void;
}

/**
 * The primary part in an area and what it holds.
 *
 * Its blocks come from the same entity the canvas edits, so changes made in
 * the Site parts panels show on the canvas and the other way around.
 *
 * @param area The template part area.
 * @return The primary part.
 */
export function useSitePart( area: string ): UseSitePartResult {
	const usage = useSitePartsUsage();
	const partId = usage?.primary[ area ] ?? null;
	const record = useSelect(
		( select ) =>
			partId
				? ( select( coreStore ).getEditedEntityRecord(
						'postType',
						TEMPLATE_PART_POST_TYPE,
						partId
					) as Record< string, any > )
				: null,
		[ partId ]
	);
	const [ entityBlocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		TEMPLATE_PART_POST_TYPE,
		// Without a primary part, read no entity rather than the one an
		// entity provider around this hook might supply.
		{ id: partId ?? '' }
	);
	const blocks = ( partId && entityBlocks
		? entityBlocks
		: EMPTY_ARRAY ) as unknown as SitePartBlock[];

	const contents = useMemo( () => getSitePartContents( blocks ), [ blocks ] );
	const partsInUse = useMemo(
		() => getPartsInUse( usage, area ),
		[ usage, area ]
	);
	const hasTransientEditsRef = useRef( false );
	const setBlocks = useCallback(
		(
			nextBlocks: SitePartBlock[],
			{ isTransient = false }: { isTransient?: boolean } = {}
		) => {
			hasTransientEditsRef.current = isTransient;
			( isTransient ? onInput : onChange )( nextBlocks as any, {} );
		},
		[ onInput, onChange ]
	);
	// A persistent change with the current blocks makes the undo level and
	// serializes the content. It needs a new array: passing the same blocks
	// back only makes an undo level.
	const commitBlocks = useCallback( () => {
		if ( hasTransientEditsRef.current && entityBlocks ) {
			hasTransientEditsRef.current = false;
			onChange( [ ...entityBlocks ], {} );
		}
	}, [ entityBlocks, onChange ] );

	return {
		isResolving: ! usage,
		partId,
		record,
		partsInUse,
		blocks,
		contents,
		setBlocks,
		commitBlocks,
	};
}
