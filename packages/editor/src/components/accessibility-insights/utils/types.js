/**
 * Accessibility Insights - Type Definitions
 *
 * This file contains JSDoc type definitions for the accessibility analysis system.
 */

/**
 * @typedef {'error' | 'warning'} AccessibilityIssueType
 * Severity level of an accessibility issue.
 * - 'error': Critical issues that must be fixed (e.g., missing alt text)
 * - 'warning': Recommendations for improvement (e.g., heading hierarchy)
 */

/**
 * @typedef {'alt-text' | 'heading-hierarchy' | 'link-text' | 'empty-heading'} AccessibilityCategory
 * Categories of accessibility checks.
 */

/**
 * @typedef {Object} AccessibilityIssue
 * Represents a single accessibility issue found in the content.
 * @property {string}                 id           - Unique identifier for the issue
 * @property {AccessibilityIssueType} type         - Severity level ('error' or 'warning')
 * @property {AccessibilityCategory}  category     - Category of the check that found this issue
 * @property {string}                 message      - Human-readable description of the issue
 * @property {string}                 clientId     - Block clientId for navigation
 * @property {string}                 blockType    - Block type name (e.g., 'core/image')
 * @property {string}                 [blockName]  - Human-readable block name
 * @property {string}                 [suggestion] - Optional fix suggestion
 */

/**
 * @typedef {Object} BlockLike
 * Minimal block shape for analysis functions.
 * @property {string}      clientId    - Unique block identifier
 * @property {string}      name        - Block type name (e.g., 'core/image')
 * @property {Object}      attributes  - Block attributes
 * @property {BlockLike[]} innerBlocks - Nested child blocks
 */

/**
 * @callback CheckFunction
 * Function signature for accessibility check functions.
 * @param {BlockLike[]} blocks - Array of blocks to analyze
 * @return {AccessibilityIssue[]} Array of issues found
 */

/**
 * @typedef {Object} GroupedIssues
 * Issues grouped by category.
 * @property {AccessibilityIssue[]} [alt-text]          - Alt text issues
 * @property {AccessibilityIssue[]} [heading-hierarchy] - Heading hierarchy issues
 * @property {AccessibilityIssue[]} [link-text]         - Link text issues
 * @property {AccessibilityIssue[]} [empty-heading]     - Empty heading issues
 */

/**
 * @typedef {Object} IssueCounts
 * Count of issues by severity.
 * @property {number} errors   - Number of error-level issues
 * @property {number} warnings - Number of warning-level issues
 * @property {number} total    - Total number of issues
 */

// Export empty object to make this a module
export {};
