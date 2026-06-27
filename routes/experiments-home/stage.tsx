/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { Spinner } from '@wordpress/components';
import { useEntityRecord } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import {
	createInterpolateElement,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Card, Link, Stack, Text } from '@wordpress/ui';

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

		// `active_templates` lives in its own top-level WP option.
		// An object value means enabled.
		const activeTemplates = siteSettings?.active_templates;
		combined.active_templates =
			typeof activeTemplates === 'object' && activeTemplates !== null;

		return combined;
	}, [ experiments, gutenbergExperiments, siteSettings ] );

	const setSettings = async ( values: Record< string, boolean > ) => {
		const [ changedId ] = Object.keys( values );
		const changedExperiment = ( experiments ?? [] ).find(
			( exp ) => exp.id === changedId
		);

		const editPayload: Record< string, unknown > = {};

		// `active_templates` lives in its own top-level WP option.
		if ( 'active_templates' in values ) {
			editPayload.active_templates = values.active_templates ? {} : null;
			delete values.active_templates;
		}

		if ( Object.keys( values ).length > 0 ) {
			editPayload[ 'gutenberg-experiments' ] = {
				...gutenbergExperiments,
				...values,
			};
		}
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
			title={ __( 'Gutenberg Experiments' ) }
			subTitle={ __(
				'The latest block and full site editing features before they ship in a WordPress release.'
			) }
		>
			<Stack
				className="experiments-page__container"
				direction="column"
				gap="md"
			>
				<Card.Root>
					<Card.Content>
						<Stack direction="column" gap="md">
							<Text variant="body-lg" render={ <p /> }>
								{ __(
									'The Gutenberg plugin adds editing, customization, and site building to WordPress, and gives early adopters access to the latest block and full site editing features before they ship in a WordPress release.'
								) }
							</Text>
							<Text variant="body-lg" render={ <p /> }>
								{ createInterpolateElement(
									__(
										'The experiments below are in active development, so expect rough edges and changes over time. To learn more about the project and how to build with blocks, see the <a>Block Editor Handbook</a>.'
									),
									{
										a: (
											<Link
												href="https://developer.wordpress.org/block-editor/"
												openInNewTab
											/>
										),
									}
								) }
							</Text>
						</Stack>
					</Card.Content>
				</Card.Root>
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
			</Stack>
		</Page>
	);
}

function Stage() {
	return <ExperimentsPage />;
}

export const stage = Stage;
