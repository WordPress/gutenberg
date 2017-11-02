/**
* External Dependencies
*/
import { flowRight } from 'lodash';

/**
 * WordPress depensdencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { PanelBody, withAPIData, Placeholder, Spinner } from '@wordpress/components';

/**
* Internal dependencies
*/
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import BlockDescription from '../../block-description';
import RangeControl from '../../inspector-controls/range-control';
import SingleAuthor from '../../single-author';

class AuthorsBlock extends Component {
	constructor() {
		super( ...arguments );
		this.toggleHideBio = this.toggleHideBio.bind( this );
		this.toggleHideAvatar = this.toggleHideAvatar.bind( this );
		this.toggleHideName = this.toggleHideName.bind( this );
		this.setColumnsNumber = this.setColumnsNumber.bind( this );
	}
	toggleHideBio() {
		const { attributes, setAttributes } = this.props;
		setAttributes( { hideBio: ! attributes.hideBio } );
	}

	toggleHideAvatar() {
		const { attributes, setAttributes } = this.props;
		setAttributes( { hideAvatar: ! attributes.hideAvatar } );
	}

	toggleHideName() {
		const { attributes, setAttributes } = this.props;
		setAttributes( { hideName: ! attributes.hideName } );
	}

	setColumnsNumber( value ) {
		this.props.setAttributes( { columns: value } );
	}

	render() {
		const { focus, attributes, setAttributes, authors } = this.props;
		const { align, hideBio, hideAvatar, hideName, columns } = attributes;
		return [
			authors.isLoading && (
				<Placeholder key="placeholder"
					icon="admin-post"
					label={ __( 'Author' ) }
				>
					<Spinner />
				</Placeholder>
			),
			authors.data && (
				<div className={ `wp-blocks-authors columns-${ columns }` }>
					{ authors.data.map( ( author, index ) => (
						<SingleAuthor key={ `single-author-${ index }` }
							avatar={ hideAvatar ? null : author.avatar_urls[ '96' ] }
							bio={ hideBio ? null : author.description }
							name={ hideName ? null : author.name }
						/>
					) ) }
				</div>
			),
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'Shows the post author' ) }</p>
					</BlockDescription>
					<PanelBody title={ __( 'Alignment' ) }>
						<BlockAlignmentToolbar
							value={ align }
							onChange={ ( nextAlign ) => setAttributes( { align: nextAlign } ) }
						/>
					</PanelBody>
					<ToggleControl
						label={ __( 'Hide bio' ) }
						checked={ hideBio }
						onChange={ this.toggleHideBio }
					/>
					<ToggleControl
						label={ __( 'Hide avatar' ) }
						checked={ hideAvatar }
						onChange={ this.toggleHideAvatar }
					/>
					<ToggleControl
						label={ __( 'Hide name' ) }
						checked={ hideName }
						onChange={ this.toggleHideName }
					/>
					<RangeControl
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ this.setColumnsNumber }
						min={ 1 }
						max={ 8 }
					/>
				</InspectorControls>
			),
		];
	}
}

const applyWithAPIData = withAPIData( () => ( {
	authors: '/wp/v2/users?roles%5B%5D=administrator&roles%5B%5D=editor&roles%5B%5D=author&context=edit&per_page=100',
} ) );

export default flowRight( [
	applyWithAPIData,
] )( AuthorsBlock );
