// The Block Type is the most important concept within the block API. It defines
// all aspects of the block configuration and its interfaces (including "edit"
// and "save"). The transforms specification allows converting one block type to
// another. Transforming a block into another block can be a destructive
// operation depending on the heuristics established by the two blocks (the
// source and the destination).
export {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	cloneBlock,
	getPossibleBlockTransformations,
	switchToBlockType,
	getBlockTransforms,
	findTransform,
	getBlockFromExample,
} from './factory';

// The block tree is composed of a collection of block nodes. Blocks contained
// within other blocks are called "inner blocks". An important design
// consideration is that inner blocks are -- conceptually -- not part of the
// territory established by the parent block that contains them.
//
// This has multiple practical implications: when parsing, we can safely dispose
// of any block boundary found within a block from the innerHTML property when
// transfering to state. Not doing so has a compounding effect on memory and
// uncertainty over the source of truth since, given a tree of n nested blocks,
// the entry node would have to contain the actual content of each block while
// each subsequent block node in the state tree would replicate the whole chain
// n-1, meaning the extreme end would have been replicated n times as the tree
// is traversed and would generate uncertainty as to which one is to hold the
// current value of the block. For composition, it also means inner blocks can
// effectively be child components whose mechanisms can be shielded from the
// `edit` implementation and just passed along.
export {
	default as parse,
	getBlockAttributes,
	parseWithAttributeSchema,
} from './parser';
export {
	pasteHandler,
	rawHandler,
	deprecatedGetPhrasingContentSchema as getPhrasingContentSchema,
} from './raw-handling';

// The process of serialization aims to deflate the internal memory of the block
// editor and its state representation back into an HTML document. This process
// restores the document integrity and inserts invisible delimiters around each
// block with HTML comment boundaries which can contain any extra attributes
// needed to operate with the block later on.
export {
	default as serialize,
	getBlockContent,
	getBlockDefaultClassName,
	getBlockMenuDefaultClassName,
	getSaveElement,
	getSaveContent,
	getBlockProps as __unstableGetBlockProps,
} from './serializer';

// "Validation" is the process of comparing a block source with its output
// before there is any user input or interaction with a block. When this
// operation fails -- for whatever reason -- the block is to be considered
// invalid. As part of validating a block the system will attempt to run the
// source against any provided deprecation definitions.
//
// Worth emphasizing that validation is not a case of whether the markup is
// "valid" in terms of being HTML spec-compliant but about how the editor knows
// to create such markup and that its inability to create an identical result
// can be a strong indicator of potential data loss (the invalidation is then a
// protective measure).
//
// The invalidation process can also be deconstructed in phases: 1) validate the
// block exists; 2) validate the source matches output; 3) validate the source
// matches deprecated outputs; 4) validate the significance of differences.
// These are stacked in a way that favors performance and optimizes for the
// majority of cases. That is to say, the evaluation logic can become more
// sophisticated the further down it goes in the process. The first few checks
// have to be extremely efficient since they will be run for all valid blocks.
// However, once a block is detected as invalid -- failing the three first steps
// -- it is adequate to spend more time determining validity before throwing a
// conflict.
export { isValidBlockContent } from './validation';
export { getCategories, setCategories, updateCategory } from './categories';

// Blocks are inherently indifferent about where the data they operate with ends
// up being saved. For example, all blocks can have a static and dynamic aspect
// to them depending on the needs. The static nature of a block is the "save"
// definition that is meant to be serialized into HTML and which can be left
// null. Any block can also register a "render_callback" on the server, which
// makes their output dynamic either in part or in its totality.
//
// "Child" blocks are defined as a relationship that builds on top of the inner
// blocks mechanism. A child block is a block node that can only exist within
// the inner block boundaries of a specific parent. This allows block authors to
// compose specific block nodes that are not meant to be used outside of a
// specific context. Thus, child blocks extend the concept of inner blocks to
// support a more direct relationship between sets of blocks. The addition of
// parent–child would be a subset of the inner block functionality under the
// premise that certain blocks only make sense as children of another block.
export {
	registerBlockType,
	registerBlockCollection,
	unregisterBlockType,
	setFreeformContentHandlerName,
	getFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
	getUnregisteredTypeHandlerName,
	setDefaultBlockName,
	getDefaultBlockName,
	setGroupingBlockName,
	getGroupingBlockName,
	getBlockType,
	getBlockTypes,
	getBlockSupport,
	hasBlockSupport,
	getBlockVariations,
	isReusableBlock,
	getChildBlockNames,
	hasChildBlocks,
	hasChildBlocksWithInserterSupport,
	unstable__bootstrapServerSideBlockDefinitions, // eslint-disable-line camelcase
	registerBlockStyle,
	unregisterBlockStyle,
	registerBlockVariation,
	unregisterBlockVariation,
} from './registration';
export {
	isUnmodifiedDefaultBlock,
	normalizeIconObject,
	isValidIcon,
	getBlockLabel as __experimentalGetBlockLabel,
	getAccessibleBlockLabel as __experimentalGetAccessibleBlockLabel,
} from './utils';

// Templates are, in a general sense, a basic collection of block nodes with any
// given set of predefined attributes that are supplied as the initial state of
// an inner blocks group. These nodes can, in turn, contain any number of nested
// blocks within their definition. Templates allow both to specify a default
// state for an editor session or a default set of blocks for any inner block
// implementation within a specific block.
export {
	doBlocksMatchTemplate,
	synchronizeBlocksWithTemplate,
} from './templates';
export { default as children } from './children';
export { default as node } from './node';
export { __EXPERIMENTAL_STYLE_PROPERTY } from './constants';
