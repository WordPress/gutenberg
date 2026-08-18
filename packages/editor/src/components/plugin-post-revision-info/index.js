import { createSlotFill } from '@wordpress/components';

/**
 * @typedef {Object} PluginPostRevisionInfoContext
 * @property {number|string} revisionId  Selected revision id (`editor.revisionId`).
 * @property {Object|null}   revision    core-data revision record, or null while loading.
 * @property {string}        revisionKey Entity revision key (`id` or `wp_id`).
 * @property {number|string} postId      Parent post id (never the revision).
 * @property {string}        postType    Parent post type.
 */

const { Fill, Slot } = createSlotFill( 'PluginPostRevisionInfo' );

/**
 * Renders in the visual revisions document sidebar, under the revision post card.
 *
 * `children` may be a node or a function receiving `{ context: PluginPostRevisionInfoContext }`.
 * `context.revision` is null while the record is loading.
 *
 * @param {Object}                   props             Component properties.
 * @param {string}                   [props.className] An optional class name added to the wrapper.
 * @param {React.ReactNode|Function} props.children    Children to be rendered, or a function receiving `{ context }`.
 *
 * @example
 * ```js
 * // Using ES5 syntax
 * var __ = wp.i18n.__;
 * var PluginPostRevisionInfo = wp.editor.PluginPostRevisionInfo;
 *
 * function MyPluginPostRevisionInfo() {
 * 	return React.createElement(
 * 		PluginPostRevisionInfo,
 * 		{
 * 			className: 'my-plugin-post-revision-info',
 * 		},
 * 		__( 'My post revision info' )
 * 	)
 * }
 * ```
 *
 * @example
 * ```jsx
 * // Using ESNext syntax
 * import { PluginPostRevisionInfo } from '@wordpress/editor';
 *
 * const MyPluginPostRevisionInfo = () => (
 * 	<PluginPostRevisionInfo className="my-plugin-post-revision-info">
 * 		{ ( { context } ) => (
 * 			<div>
 * 				{ context.revisionId }
 * 				{ context.revision && context.revision.date }
 * 			</div>
 * 		) }
 * 	</PluginPostRevisionInfo>
 * );
 * ```
 *
 * @return {React.ReactNode} The rendered component.
 */
const PluginPostRevisionInfo = ( { children, className } ) => (
	<Fill>
		{ ( fillProps ) => (
			<div className={ className }>
				{ typeof children === 'function'
					? children( fillProps )
					: children }
			</div>
		) }
	</Fill>
);
PluginPostRevisionInfo.Slot = Slot;

export default PluginPostRevisionInfo;
