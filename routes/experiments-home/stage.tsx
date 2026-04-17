/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { Spinner } from '@wordpress/components';
import { useEntityRecord } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import './style.scss';
import { fetchExperiments, type Experiment } from './api';

function ExperimentsPage() {
	const [ experiments, setExperiments ] = useState< Experiment[] | null >(
		null
	);

	useEffect( () => {
		fetchExperiments()
			.then( setExperiments )
			.catch( () => setExperiments( [] ) );
	}, [] );

	const {
		editedRecord,
		save: saveSettings,
		edit,
	} = useEntityRecord( 'root', 'site', undefined as unknown as string );
	const siteSettings = editedRecord as Record< string, unknown > | undefined;

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

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

	const setSettings = async ( values: Record< string, boolean > ) => {
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

		const [ changedId ] = Object.keys( values );
		const changedExperiment = ( experiments ?? [] ).find(
			( exp ) => exp.id === changedId
		);
		const groupLabel = changedExperiment?.groupLabel ?? '';

		edit( editPayload );
		try {
			await saveSettings();
			createSuccessNotice(
				sprintf(
					/* translators: %s: Experiment group name, e.g. "Blocks". */
					__( '%s settings updated.' ),
					groupLabel
				),
				{ type: 'snackbar' }
			);
		} catch {
			createErrorNotice(
				sprintf(
					/* translators: %s: Experiment group name, e.g. "Blocks". */
					__( 'Failed to update %s settings.' ),
					groupLabel
				),
				{ type: 'snackbar' }
			);
		}
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

		const groups = new Map< string, { label: string; items: string[] } >();
		experiments.forEach( ( experiment ) => {
			const slug = experiment.group || 'other';
			if ( ! groups.has( slug ) ) {
				groups.set( slug, {
					label: experiment.groupLabel || slug,
					items: [],
				} );
			}
			groups.get( slug )!.items.push( experiment.id );
		} );

		return Array.from( groups.entries() ).map( ( [ slug, group ] ) => ( {
			id: `gutenberg-experiments--${ slug }`,
			label: group.label,
			layout: {
				type: 'card' as const,
				withHeader: true as const,
				isCollapsible: true,
				isOpened: true,
			},
			children: group.items,
		} ) );
	}, [ experiments ] );

	if ( experiments === null || ! siteSettings ) {
		return <Spinner />;
	}

	return (
		<Page
			title={ __( 'Experimental settings' ) }
			subTitle={ __(
				"The block editor includes experimental features that are usable while they're in development. Select the ones you'd like to enable. These features are likely to change, so avoid using them in production."
			) }
		>
			<div className="experiments-page__form">
				<DataForm
					data={ settings }
					fields={ fields }
					form={ {
						layout: { type: 'card' },
						fields: formFields,
					} }
					onChange={ ( values ) => {
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
