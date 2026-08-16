import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'PluginPostRevisionHeader' );

/**
 * Renders in the visual revisions header settings cluster, after Settings and before Exit.
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
 * var PluginPostRevisionHeader = wp.editor.PluginPostRevisionHeader;
 *
 * function MyPluginPostRevisionHeader() {
 * 	return React.createElement(
 * 		PluginPostRevisionHeader,
 * 		{
 * 			className: 'my-plugin-post-revision-header',
 * 		},
 * 		__( 'My post revision header' )
 * 	)
 * }
 * ```
 *
 * @example
 * ```jsx
 * // Using ESNext syntax
 * import { PluginPostRevisionHeader } from '@wordpress/editor';
 *
 * const MyPluginPostRevisionHeader = () => (
 * 	<PluginPostRevisionHeader className="my-plugin-post-revision-header">
 * 		{ ( { context } ) => (
 * 			<div>
 * 				{ context.revisionId }
 * 				{ context.revision && context.revision.date }
 * 			</div>
 * 		) }
 * 	</PluginPostRevisionHeader>
 * );
 * ```
 *
 * @return {React.ReactNode} The rendered component.
 */
const PluginPostRevisionHeader = ( { children, className } ) => (
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
PluginPostRevisionHeader.Slot = Slot;

export default PluginPostRevisionHeader;
