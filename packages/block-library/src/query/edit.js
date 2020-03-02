/**
 * Internal dependencies
 */
import QueryPanel from './query-panel';

/**
 * External dependencies
 */
import classNames from 'classnames';
import { debounce, isUndefined, pickBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import {
	BlockList,
	BlockEditorProvider,
	InspectorControls,
	WritingFlow,
} from '@wordpress/block-editor';
import { cloneBlock, createBlock } from '@wordpress/blocks';
import { PanelBody, Placeholder, Spinner } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { EntityProvider } from '@wordpress/core-data';
import { withSelect } from '@wordpress/data';

const defaultFields = [
	'core/post-title',
	'core/post-date',
	'core/post-author',
	'core/post-excerpt',
];

class Edit extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			editingPost: null,
			blocksTree: {},
		};

		this.debouncedCreateBlockTree = debounce(
			this.createBlockTree.bind( this ),
			1000
		);
	}

	componentDidMount() {
		this.createBlockTree();
		this.updateBlocks( defaultFields.map( ( f ) => createBlock( f ) ) );
	}

	componentDidUpdate( prevProps ) {
		const { query } = this.props;
		if ( prevProps.query !== query ) {
			this.createBlockTree();
		}
	}

	createBlockTree() {
		const { editingPost, blocksTree } = this.state;
		const { attributes, query } = this.props;
		const { blocks } = attributes;
		const newBlocksTree = ( query || [] ).reduce(
			( accumulator, post ) => ( {
				...accumulator,
				[ post.id ]:
					post.id === editingPost
						? blocksTree[ post.id ]
						: blocks.map( ( block ) =>
								cloneBlock( block, { post } )
						  ),
			} ),
			{}
		);
		this.setState( { blocksTree: newBlocksTree } );
	}

	cleanBlock( block ) {
		const { name, isValid, attributes, innerBlocks } = block;
		return {
			name,
			attributes: { ...attributes, post: {} },
			innerBlocks: innerBlocks.map( ( b ) => this.cleanBlock( b ) ),
			isValid,
		};
	}

	updateBlocks( blocks, postId ) {
		const { setAttributes } = this.props;
		const { blocksTree } = this.state;
		const cleanBlocks = blocks.map( this.cleanBlock );
		this.setState(
			{
				blocksTree: { ...( blocksTree || [] ), [ postId ]: blocks },
				editingPost: postId,
			},
			() => {
				setAttributes( { blocks: cleanBlocks } );
				this.debouncedCreateBlockTree();
			}
		);
	}

	render() {
		const {
			attributes,
			className,
			postList,
			query,
			setAttributes,
		} = this.props;

		const { criteria } = attributes;

		const { editingPost, blocksTree } = this.state;
		const settings = {};
		const classes = classNames(
			className,
			editingPost ? 'is-editing' : ''
		);

		return (
			<div className={ classes }>
				<InspectorControls>
					<PanelBody
						title={ __( 'Query Settings' ) }
						initialOpen={ true }
					>
						<QueryPanel
							criteria={ criteria }
							postList={ postList }
							onChange={ ( newCriteria ) =>
								setAttributes( { criteria: newCriteria } )
							}
						/>
					</PanelBody>
				</InspectorControls>
				<Fragment>
					{ ! query && (
						<Placeholder>
							<Spinner />
						</Placeholder>
					) }
					{ query && ! query.length && (
						<Placeholder>
							{ __(
								'Sorry, no posts were found.',
								'newspack-blocks'
							) }
						</Placeholder>
					) }
					{ query &&
						!! query.length &&
						query.map( ( post ) => {
							if ( ! blocksTree[ post.id ] ) return null;
							return (
								<article
									className={
										post.id === editingPost
											? 'is-editing'
											: ''
									}
									key={ post.id }
								>
									<EntityProvider
										kind="postType"
										type="post"
										id={ post.id }
									>
										<BlockEditorProvider
											value={ blocksTree[ post.id ] }
											onChange={ ( blocks ) =>
												this.updateBlocks(
													blocks,
													post.id
												)
											}
											settings={ settings }
										>
											<WritingFlow>
												<BlockList />
											</WritingFlow>
										</BlockEditorProvider>
									</EntityProvider>
								</article>
							);
						} ) }
				</Fragment>
			</div>
		);
	}
}

const isSpecificPostModeActive = ( { specificMode, specificPosts } ) =>
	specificMode && specificPosts && specificPosts.length;

const queryCriteriaFromAttributes = ( criteria ) => {
	const {
		per_page: perPage,
		author,
		categories,
		tags,
		specificPosts,
	} = criteria;
	const queryCriteria = pickBy(
		isSpecificPostModeActive( criteria )
			? {
					include: specificPosts,
					orderby: 'include',
					per_page: specificPosts.length,
			  }
			: {
					per_page: perPage,
					categories,
					author,
					tags,
			  },
		( value ) => ! isUndefined( value )
	);
	return queryCriteria;
};

export default compose(
	withSelect( ( select, props ) => {
		const { attributes } = props;
		const { criteria } = attributes;
		const queryCriteria = queryCriteriaFromAttributes( criteria );

		return {
			query: select( 'core' ).getEntityRecords(
				'postType',
				'post',
				queryCriteria
			),
		};
	} )
)( Edit );
