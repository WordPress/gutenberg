/**
 * Revision Diff Viewer - Type Definitions
 *
 * This file contains JSDoc type definitions for the revision diff system.
 */

/**
 * @typedef {'added' | 'removed' | 'modified' | 'unchanged'} DiffType
 * The type of change detected for a block.
 */

/**
 * @typedef {Object} AttributeChange
 * Represents a change to a single block attribute.
 * @property {string} attribute - The attribute name that changed
 * @property {*}      oldValue  - The previous value
 * @property {*}      newValue  - The new value
 */

/**
 * @typedef {Object} BlockData
 * Represents a parsed block's data.
 * @property {string}      blockName   - The block type name (e.g., 'core/paragraph')
 * @property {Object}      attrs       - Block attributes
 * @property {string}      innerHTML   - The block's inner HTML content
 * @property {BlockData[]} innerBlocks - Nested child blocks
 */

/**
 * @typedef {Object} BlockDiffItem
 * Represents a single block diff item.
 * @property {string}            id                 - Unique identifier for the diff item
 * @property {DiffType}          type               - The type of change
 * @property {string}            blockName          - The block type name
 * @property {BlockData}         [oldBlock]         - Block data from the older revision
 * @property {BlockData}         [newBlock]         - Block data from the newer revision
 * @property {AttributeChange[]} [attributeChanges] - Specific attribute differences
 * @property {BlockDiffItem[]}   [innerBlocksDiff]  - Diff of nested blocks
 */

/**
 * @typedef {Object} DiffSummary
 * Summary counts of changes between revisions.
 * @property {number} added     - Number of blocks added
 * @property {number} removed   - Number of blocks removed
 * @property {number} modified  - Number of blocks modified
 * @property {number} unchanged - Number of unchanged blocks
 */

/**
 * @typedef {Object} RevisionDiff
 * The complete revision diff response from the API.
 * @property {number}          oldRevisionId - ID of the source revision
 * @property {number}          newRevisionId - ID of the target revision
 * @property {string}          oldDate       - Date of the source revision
 * @property {string}          newDate       - Date of the target revision
 * @property {string}          oldAuthor     - Author of the source revision
 * @property {string}          newAuthor     - Author of the target revision
 * @property {DiffSummary}     summary       - Summary of changes
 * @property {BlockDiffItem[]} blocks        - Array of block diff items
 */

/**
 * @typedef {Object} Revision
 * Represents a WordPress revision.
 * @property {number} id     - The revision ID
 * @property {string} date   - The revision date
 * @property {string} author - The revision author display name
 */

export {};
