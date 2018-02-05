/**
 * External dependencies
 */
import { isUndefined, pickBy } from 'lodash';
import moment from 'moment';
import classnames from 'classnames';
import { stringify } from 'querystringify';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder, Toolbar, Spinner, withAPIData } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import QueryPanel from '../../query-panel';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import RangeControl from '../../inspector-controls/range-control';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const MAX_POSTS_COLUMNS = 6;

class NavigationMenuBlock extends Component {
	constructor() {
		super( ...arguments );

		this.toggleDisplayPostDate = this.toggleDisplayPostDate.bind( this );
	}

	toggleDisplayPostDate() {
		const { displayPostDate } = this.props.attributes;
		const { setAttributes } = this.props;

		setAttributes( { displayPostDate: ! displayPostDate } );
	}

	render() {
		const { attributes, focus, setAttributes } = this.props;
		const { align, layout } = attributes;
		const menus = this.props.menus.data;

		const inspectorControls = focus && (
			<InspectorControls key="inspector">
				<h3>{ __( 'Menu Settings' ) }</h3>
			</InspectorControls>
		);

		const hasPosts = Array.isArray( menus ) && menus.length;
		if ( ! hasPosts ) {
			return [
				inspectorControls,
				<Placeholder key="placeholder"
					icon="admin-post"
					label={ __( 'Navigation Menu' ) }
				>
					{ ! Array.isArray( menus ) ?
						<Spinner /> :
						__( 'No posts found.' )
					}
				</Placeholder>,
			];
		}

		const layoutControls = [
			{
				icon: 'list-view',
				title: __( 'Vertical View' ),
				onClick: () => setAttributes( { layout: 'vertical' } ),
				isActive: layout === 'vertical',
			},
			{
				icon: 'grid-view',
				title: __( 'Horizontal View' ),
				onClick: () => setAttributes( { layout: 'horizontal' } ),
				isActive: layout === 'horizontal',
			},
		];

		return [
			inspectorControls,
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
						controls={ [ 'center', 'wide', 'full' ] }
					/>
					<Toolbar controls={ layoutControls } />
				</BlockControls>
			),
			<Placeholder
				key="block-placeholder"
				instructions={ __( 'Select an existing menu' ) }
				icon={ 'menu' }
				label={ __( 'Navigation Menu' ) } >
				Test child
			</Placeholder>,
		];
	}
}

export default withAPIData( () => ( {
	menus: '/wp/v2/menus',
} ) )( NavigationMenuBlock );
