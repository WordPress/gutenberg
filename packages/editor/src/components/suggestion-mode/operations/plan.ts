/**
 * A plan of block-editor and overlay effects, computed by the pure planners
 * in this directory and dispatched by the decision hook. Keeping the planning
 * separate from dispatch lets the structural reject logic be unit tested
 * against a block tree without a registry.
 */

export type PlanStep =
	/** Let the next write to this block past the Suggest mode interceptor. */
	| { step: 'bypass'; clientId: string }
	/** Drop the block's overlay entry. */
	| { step: 'clearOverlay'; clientId: string }
	| {
			step: 'updateBlockAttributes';
			clientId: string;
			attributes: Record< string, any >;
	  }
	| { step: 'removeBlock'; clientId: string; selectPrevious?: boolean }
	| {
			step: 'insertBlock';
			block: any;
			index: number;
			rootClientId: string | undefined;
			updateSelection: boolean;
	  }
	| {
			step: 'moveBlockToPosition';
			clientId: string;
			fromRootClientId: string;
			toRootClientId: string;
			index: number;
	  };

export interface BlockPlan {
	/** Steps run one after another, each notifying store subscribers. */
	steps: PlanStep[];
	/**
	 * Steps run inside one `registry.batch`, so subscribers see them as a
	 * single store update.
	 */
	batched: PlanStep[];
}

/**
 * Read access to the block tree a planner needs, in the shape of the
 * block-editor store selectors so a registry's `select( blockEditorStore )`
 * can be passed straight through.
 */
export interface BlockTreeReader {
	getBlockAttributes: ( clientId: string ) => Record< string, any > | null;
	getBlockRootClientId: ( clientId: string ) => string | null;
	getBlockName: ( clientId: string ) => string | null;
	getBlockOrder: ( rootClientId?: string ) => string[];
	getBlock: ( clientId: string ) => any;
}
