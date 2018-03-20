/**
 * External dependencies
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { BaseControl, PanelBody, Placeholder } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './editor.scss';
import InspectorControls from '../../inspector-controls';

export const name = 'core/map';

class LocationControl extends Component {
	constructor() {
		super();
		this.onKeyDown = this.onKeyDown.bind( this );
	}

	onKeyDown( e ) {
		if ( keycodes.ENTER === e.keyCode ) {
			const address = e.target.value;
			const encodedAddress = encodeURIComponent( address );

			window.fetch( `https://nominatim.openstreetmap.org/search.php?q=${ encodedAddress }&format=jsonv2` )
				.then( response => response.json() )
				.then( results => {
					if ( results.length > 0 ) {
						const location = results[ 0 ];
						this.props.onSelectLocation( {
							address,
							latitude: parseFloat( location.lat ),
							longitude: parseFloat( location.lon ),
						} );
					}
				} );
		}
	}

	render() {
		return <input onKeyDown={ this.onKeyDown } />;
	}
}

function MapInspectorControls( { setLocation } ) {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Map Location' ) }>
				<BaseControl label={ __( 'Location' ) }>
					<LocationControl onSelectLocation={ setLocation } />
				</BaseControl>
			</PanelBody>
		</InspectorControls>
	);
}

function MapPlaceholder( { setLocation } ) {
	return (
		<Placeholder
			className="map-placeholder"
			icon="location"
			label={ __( 'Map' ) }
			instructions={ __( 'Enter a business name or an address:' ) }
		>
			<LocationControl onSelectLocation={ setLocation } />
		</Placeholder>
	);
}

class MapView extends Component {
	constructor() {
		super();
		this.placeMap = this.placeMap.bind( this );
	}

	placeMap( mapNode ) {
		if ( this.map ) {
			this.map.remove();
			this.map = null;
		}

		if ( mapNode ) {
			const { latitude, longitude } = this.props;
			setTimeout( () => {
				this.map = new L.Map( mapNode );

				this.map.addLayer( new L.TileLayer( 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					minZoom: 3,
					maxZoom: 12,
					attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				} ) );

				const coordinates = new L.LatLng( latitude, longitude );
				this.map.setView( coordinates, 9 );
				this.map.addLayer( L.marker( coordinates, {
					icon: L.icon( {
						iconUrl: 'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
					} ),
				} ) );
			}, 1000 );
		}
	}

	componentDidUpdate( {
		latitude: previousLatitude,
		longitude: previousLongitude,
	} ) {
		if ( ! this.map ) {
			return;
		}

		const { latitude, longitude } = this.props;
		const coordinates = new L.LatLng( latitude, longitude );

		if ( latitude !== previousLatitude || longitude !== previousLongitude ) {
			this.map.setView( coordinates );
		}
	}

	render() {
		return (
			<div className="map-view">
				<div className="map" ref={ this.placeMap } />
			</div>
		);
	}
}

class MapBlock extends Component {
	constructor() {
		super();
		this.setLocation = this.setLocation.bind( this );
	}

	setLocation( { address, latitude, longitude } ) {
		this.props.setAttributes( {
			address,
			latitude,
			longitude,
		} );
	}

	render() {
		const { attributes, isSelected } = this.props;
		const { latitude, longitude } = attributes;

		return [
			isSelected && <MapInspectorControls key="inspector" setLocation={ this.setLocation } />,
			isFinite( latitude ) && isFinite( longitude ) ?
				<MapView key="view" latitude={ latitude } longitude={ longitude } /> :
				<MapPlaceholder key="placeholder" setLocation={ this.setLocation } />,
		];
	}
}

export const settings = {
	title: __( 'Map' ),
	description: __( 'Display a location.' ),
	icon: 'location',
	category: 'widgets',
	keywords: [ __( 'address' ), __( 'location' ) ],

	attributes: {
		address: {
			type: 'string',
		},
		latitude: {
			type: 'number',
		},
		longitude: {
			type: 'number',
		},
	},

	edit: MapBlock,

	save( { attributes } ) {
		return (
			<div>
				Gettin&apos; mappy...<span>{ attributes.address }</span>
			</div>
		);
	},
};
