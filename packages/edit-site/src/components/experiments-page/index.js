/**
 * WordPress dependencies
 */
import {
	Button,
	Spinner,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { __, _x } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useExperiments } from '../experiments-context';

/**
 * Group labels for experiment categories.
 */
const GROUP_LABELS = {
	blocks: _x( 'Blocks', 'experiment group' ),
	media: _x( 'Media', 'experiment group' ),
	collaboration: _x( 'Collaboration', 'experiment group' ),
	'data-views': _x( 'Data Views', 'experiment group' ),
	interactivity: _x( 'Interactivity', 'experiment group' ),
	'content-only': _x( 'contentOnly', 'experiment group' ),
	other: _x( 'Other', 'experiment group' ),
};

/**
 * Order in which groups should appear.
 */
const GROUP_ORDER = [
	'blocks',
	'media',
	'collaboration',
	'data-views',
	'interactivity',
	'content-only',
	'other',
];

export default function ExperimentsPage() {
	const experiments = useExperiments();

	const {
		editedRecord: siteSettings,
		save: saveSettings,
		edit,
		isSaving,
		edits,
	} = useEntityRecord( 'root', 'site' );

	const settings = siteSettings[ 'gutenberg-experiments' ] || {};

	const setSettings = ( values ) => {
		edit( {
			'gutenberg-experiments': {
				...settings,
				...values,
			},
		} );
	};

	const resetSettings = () => {
		edit( {
			'gutenberg-experiments': null,
		} );
		saveSettings();
	};

	const hasChanges = Object.keys( edits || {} ).length > 0;

	const allSettingsAreDisabled = Object.values( settings ).every(
		( value ) => value === false
	);

	// Generate fields from experiments passed from PHP.
	const fields = useMemo( () => {
		if ( ! experiments || ! experiments.length ) {
			return [];
		}
		return experiments.map( ( experiment ) => ( {
			Edit: 'checkbox',
			id: experiment.id,
			label: experiment.label,
			description: experiment.description,
			type: 'boolean',
		} ) );
	}, [ experiments ] );

	// Generate form groups from experiments.
	const formFields = useMemo( () => {
		if ( ! experiments || ! experiments.length ) {
			return [];
		}

		// Group experiments by their group property.
		const groupedExperiments = {};
		experiments.forEach( ( experiment ) => {
			const group = experiment.group || 'other';
			if ( ! groupedExperiments[ group ] ) {
				groupedExperiments[ group ] = [];
			}
			groupedExperiments[ group ].push( experiment.id );
		} );

		// Create form field groups in the defined order.
		return GROUP_ORDER.filter(
			( groupId ) => groupedExperiments[ groupId ]
		).map( ( groupId ) => ( {
			id: `gutenberg-experiments--${ groupId }`,
			label: GROUP_LABELS[ groupId ] || groupId,
			type: 'group',
			labelPosition: 'side',
			children: groupedExperiments[ groupId ],
		} ) );
	}, [ experiments ] );

	if ( ! settings ) {
		return <Spinner />;
	}

	return (
		<Page
			title={ __( 'Experimental settings' ) }
			actions={
				<HStack>
					<Button
						variant="tertiary"
						isDestructive
						onClick={ () => {
							resetSettings();
						} }
						__next40pxDefaultSize
						disabled={ isSaving || allSettingsAreDisabled }
						accessibleWhenDisabled
						isBusy={ isSaving }
					>
						{ __( 'Reset to default' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ () => {
							saveSettings();
						} }
						__next40pxDefaultSize
						disabled={ ! hasChanges || isSaving }
						accessibleWhenDisabled
						isBusy={ isSaving }
					>
						{ __( 'Save' ) }
					</Button>
				</HStack>
			}
		>
			<div className="experiments-page__form">
				<DataForm
					data={ settings }
					fields={ fields }
					form={ {
						fields: formFields,
						labelPosition: 'side',
						type: 'regular',
					} }
					onChange={ ( values ) => {
						setSettings( values );
					} }
				/>
			</div>
		</Page>
	);
}
