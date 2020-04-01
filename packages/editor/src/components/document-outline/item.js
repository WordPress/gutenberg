/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BlockTitle } from '@wordpress/block-editor';

const TableOfContentsItem = ( {
	children,
	isValid,
	level,
	path = [],
	href,
	onSelect,
} ) => (
	<li
		className={ classnames(
			'document-outline__item',
			`is-${ level.toLowerCase() }`,
			{
				'is-invalid': ! isValid,
			}
		) }
	>
		<a
			href={ href }
			className="document-outline__button"
			onClick={ onSelect }
		>
			<span
				className="document-outline__emdash"
				aria-hidden="true"
			></span>
			{ // path is an array of nodes that are ancestors of the heading starting in the top level node.
			// This mapping renders each ancestor to make it easier for the user to know where the headings are nested.
			path.map( ( { clientId }, index ) => (
				<strong key={ index } className="document-outline__level">
					<BlockTitle clientId={ clientId } />
				</strong>
			) ) }
			<strong className="document-outline__level">{ level }</strong>
			<span className="document-outline__item-content">{ children }</span>
		</a>
	</li>
);

export default TableOfContentsItem;
