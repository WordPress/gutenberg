/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';
import { useEntityRecord } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Experiment, SettingsSchema } from './types';

const GROUP_LABELS: Record< string, string > = {
	blocks: _x( 'Blocks', 'experiment group' ),
	media: _x( 'Media', 'experiment group' ),
	collaboration: _x( 'Collaboration', 'experiment group' ),
	'data-views': _x( 'Data Views', 'experiment group' ),
	interactivity: _x( 'Interactivity', 'experiment group' ),
	'content-only': _x( 'contentOnly', 'experiment group' ),
	templates: _x( 'Templates', 'experiment group' ),
	other: _x( 'Other', 'experiment group' ),
};

const GROUP_ORDER = [
	'blocks',
	'media',
	'collaboration',
	'data-views',
	'interactivity',
	'content-only',
	'templates',
	'other',
];

function useExperiments(): Experiment[] | null {
	const [ experiments, setExperiments ] = useState< Experiment[] | null >(
		null
	);

	useEffect( () => {
		let active = true;
		apiFetch< SettingsSchema >( {
			path: '/wp/v2/settings',
			method: 'OPTIONS',
		} )
			.then( ( response ) => {
				if ( ! active ) {
					return;
				}
				const properties =
					response?.schema?.properties?.[ 'gutenberg-experiments' ]
						?.properties ?? {};
				const list: Experiment[] = Object.entries( properties ).map(
					( [ id, schema ] ) => ( {
						id,
						label: schema.title ?? id,
						description: schema.description ?? '',
						group: schema.group ?? 'other',
						separateOption: schema.separate_option ?? false,
						optionName: schema.option_name,
					} )
				);
				setExperiments( list );
			} )
			.catch( () => {
				if ( active ) {
					setExperiments( [] );
				}
			} );
		return () => {
			active = false;
		};
	}, [] );

	return experiments;
}

function ExperimentsPage() {
	const experiments = useExperiments();

	const {
		editedRecord: siteSettings,
		save: saveSettings,
		edit,
	} = useEntityRecord( 'root', 'site' );

	const separateOptionExperiments = useMemo(
		() => ( experiments ?? [] ).filter( ( exp ) => exp.separateOption ),
		[ experiments ]
	);

	const gutenbergExperiments = useMemo(
		() => siteSettings?.[ 'gutenberg-experiments' ] || {},
		[ siteSettings ]
	);

	const settings = useMemo( () => {
		const combined: Record< string, boolean > = {};

		for ( const exp of experiments ?? [] ) {
			combined[ exp.id ] = false;
		}

		for ( const [ key, value ] of Object.entries( gutenbergExperiments ) ) {
			combined[ key ] = Boolean( value );
		}

		for ( const exp of separateOptionExperiments ) {
			const optionName = exp.optionName ?? exp.id;
			const optionValue = siteSettings?.[ optionName ];
			combined[ exp.id ] =
				typeof optionValue === 'object' && optionValue !== null;
		}

		return combined;
	}, [
		experiments,
		gutenbergExperiments,
		separateOptionExperiments,
		siteSettings,
	] );

	const setSettings = ( values: Record< string, boolean > ) => {
		const regularUpdates: Record< string, boolean > = {};
		const separateUpdates: Record< string, boolean > = {};

		for ( const [ key, value ] of Object.entries( values ) ) {
			const isSeparate = separateOptionExperiments.some(
				( exp ) => exp.id === key
			);
			if ( isSeparate ) {
				separateUpdates[ key ] = value;
			} else {
				regularUpdates[ key ] = value;
			}
		}

		const editPayload: Record< string, unknown > = {};

		if ( Object.keys( regularUpdates ).length > 0 ) {
			editPayload[ 'gutenberg-experiments' ] = {
				...gutenbergExperiments,
				...regularUpdates,
			};
		}

		for ( const [ key, value ] of Object.entries( separateUpdates ) ) {
			const exp = separateOptionExperiments.find( ( e ) => e.id === key );
			const optionName = exp?.optionName ?? key;
			editPayload[ optionName ] = value ? {} : null;
		}

		edit( editPayload );
		saveSettings();
	};

	const fields = useMemo( () => {
		if ( ! experiments?.length ) {
			return [];
		}
		return experiments.map( ( experiment ) => ( {
			Edit: 'toggle' as const,
			id: experiment.id,
			label: experiment.label,
			description: experiment.description,
			type: 'boolean' as const,
		} ) );
	}, [ experiments ] );

	const formFields = useMemo( () => {
		if ( ! experiments?.length ) {
			return [];
		}

		const groupedExperiments: Record< string, string[] > = {};
		experiments.forEach( ( experiment ) => {
			const group = experiment.group || 'other';
			if ( ! groupedExperiments[ group ] ) {
				groupedExperiments[ group ] = [];
			}
			groupedExperiments[ group ].push( experiment.id );
		} );

		return GROUP_ORDER.filter(
			( groupId ) => groupedExperiments[ groupId ]
		).map( ( groupId ) => ( {
			id: `gutenberg-experiments--${ groupId }`,
			label: GROUP_LABELS[ groupId ] || groupId,
			layout: {
				type: 'card' as const,
				withHeader: true as const,
				isCollapsible: true,
				isOpened: true,
			},
			children: groupedExperiments[ groupId ],
		} ) );
	}, [ experiments ] );

	if ( experiments === null || ! siteSettings ) {
		return <Spinner />;
	}

	return (
		<Page title={ __( 'Experimental settings' ) }>
			<div className="experiments-page__form">
				<DataForm
					data={ settings }
					fields={ fields }
					form={ {
						layout: { type: 'card' },
						fields: formFields,
					} }
					onChange={ ( values: Record< string, boolean > ) => {
						setSettings( values );
					} }
				/>
			</div>
		</Page>
	);
}

function Stage() {
	return <ExperimentsPage />;
}

export const stage = Stage;
