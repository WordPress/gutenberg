/**
 * WordPress dependencies
 */
import { Placeholder } from 'components';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import { registerBlockType } from '../../api';
import { getLatestPosts } from './data.js';
import InspectorControls from '../../inspector-controls';
import IconButton from '../../../components/icon-button';
import classNames from 'classnames';

registerBlockType( 'core/latestposts', {
	title: __( 'Latest Posts' ),

	icon: 'list-view',

	category: 'widgets',

	defaultAttributes: {
		poststoshow: 5,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: class extends wp.element.Component {
		constructor( { focus } ) {
			super( ...arguments );

			const { poststoshow } = this.props.attributes;

			this.state = {
				latestPosts: [],
				focus,
			};

			this.latestPostsRequest = getLatestPosts( poststoshow );

			this.latestPostsRequest
				.then( latestPosts => this.setState( { latestPosts } ) );
		}

		render() {
			const { latestPosts, focus } = this.state;

			const alignments = [
				{
					icon: 'align-left',
					title: wp.i18n.__( 'Align left' ),
					isActive: ( { align } ) => 'left' === align,
					value: 'left',
				},
				{
					icon: 'align-center',
					title: wp.i18n.__( 'Align center' ),
					isActive: ( { align } ) => ! align || 'center' === align,
					value: 'center',
				},
				{
					icon: 'align-right',
					title: wp.i18n.__( 'Align right' ),
					isActive: ( { align } ) => 'right' === align,
					value: 'right',
				},
				{
					icon: 'align-wide',
					title: __( 'Wide width' ),
					isActive: ( { align } ) => 'wide' === align,
					value: 'wide',
				},
				{
					icon: 'align-full-width',
					title: __( 'Full width' ),
					isActive: ( { align } ) => 'full' === align,
					value: 'full',
				},
			];

			return (
				<div>
					{ 0 === latestPosts.length ?
						<Placeholder
							icon="update"
							label={ __( 'Loading latest posts, please wait' ) }
						>
						</Placeholder>
						:
						<div className="blocks-latest-posts">
							<ul>
								{ latestPosts.map( ( post, i ) =>
									<li key={ i }><a href={ post.link }>{ post.title.rendered }</a></li>
								) }
							</ul>
						</div>
					}
					{ /* focus && */
						<InspectorControls>

							<span>Alignment</span>
							<div>
								{ alignments.map( ( alignment, index ) => (
									<IconButton
										key={ index }
										icon={ alignment.icon }
										label={ alignment.title }
										onClick={ ( event ) => {
											event.stopPropagation();
											this.props.setAttributes( { align: alignment.value } );
										} }
										className={ classNames( 'components-toolbar__control', {
											'is-active': alignment.isActive( this.props.attributes ),
										} ) }
										aria-pressed={ alignment.isActive( this.props.attributes ) }
										focus={ focus && ! index }
									/>
								) ) }
							</div>
						</InspectorControls>
					}
				</div>
			);
		}

		componentWillUnmount() {
			if ( this.latestPostsRequest.state() === 'pending' ) {
				this.latestPostsRequest.abort();
			}
		}
	},

	save() {
		return null;
	},
} );
