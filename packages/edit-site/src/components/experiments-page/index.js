/**
 * WordPress dependencies
 */
import {
	Button,
	Spinner,
	__experimentalConfirmDialog as ConfirmDialog,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { __, _x } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';

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
	templates: _x( 'Templates', 'experiment group' ),
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
	'templates',
	'other',
];

export default function ExperimentsPage() {
	const experiments = useExperiments();
	const [ isResetConfirmOpen, setIsResetConfirmOpen ] = useState( false );

	const {
		editedRecord: siteSettings,
		save: saveSettings,
		edit,
		isSaving,
		edits,
	} = useEntityRecord( 'root', 'site' );

	// Get experiments that use separate options (like active_templates).
	const separateOptionExperiments = useMemo( () => {
		if ( ! experiments ) {
			return [];
		}
		return experiments.filter( ( exp ) => exp.separateOption );
	}, [ experiments ] );

	// Memoize the gutenberg-experiments to avoid creating new objects on each render.
	const gutenbergExperiments = useMemo(
		() => siteSettings[ 'gutenberg-experiments' ] || {},
		[ siteSettings ]
	);

	// Build the combined settings object for the form.
	// This merges gutenberg-experiments with separate option values.
	// Ensure all experiments have explicit boolean values to avoid
	// uncontrolled to controlled input warnings.
	const settings = useMemo( () => {
		const combined = {};

		// Initialize all experiments with false, then override with actual values.
		if ( experiments ) {
			for ( const exp of experiments ) {
				combined[ exp.id ] = false;
			}
		}

		// Override with actual saved values from gutenberg-experiments.
		for ( const [ key, value ] of Object.entries( gutenbergExperiments ) ) {
			combined[ key ] = Boolean( value );
		}

		// Add separate option experiments to the combined settings.
		for ( const exp of separateOptionExperiments ) {
			// For active_templates, it's enabled when the option is an object.
			if ( exp.id === 'active_templates' ) {
				combined[ exp.id ] =
					typeof siteSettings.active_templates === 'object' &&
					siteSettings.active_templates !== null;
			}
		}

		return combined;
	}, [
		experiments,
		gutenbergExperiments,
		separateOptionExperiments,
		siteSettings,
	] );

	const setSettings = ( values ) => {
		const regularUpdates = {};
		const separateUpdates = {};

		// Separate regular experiments from those with separate options.
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

		const editPayload = {};

		// Update regular experiments.
		if ( Object.keys( regularUpdates ).length > 0 ) {
			editPayload[ 'gutenberg-experiments' ] = {
				...gutenbergExperiments,
				...regularUpdates,
			};
		}

		// Handle separate option experiments.
		for ( const [ key, value ] of Object.entries( separateUpdates ) ) {
			if ( key === 'active_templates' ) {
				// Set to empty object to enable, null to disable.
				editPayload.active_templates = value ? {} : null;
			}
		}

		edit( editPayload );
	};

	const resetSettings = () => {
		const resetPayload = {
			'gutenberg-experiments': null,
		};

		// Also reset separate option experiments.
		for ( const exp of separateOptionExperiments ) {
			if ( exp.id === 'active_templates' ) {
				resetPayload.active_templates = null;
			}
		}

		edit( resetPayload );
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
		<>
			<Page
				title={ __( 'Experimental settings' ) }
				actions={
					<HStack>
						<Button
							variant="tertiary"
							isDestructive
							onClick={ () => {
								setIsResetConfirmOpen( true );
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
			<ConfirmDialog
				isOpen={ isResetConfirmOpen }
				onConfirm={ () => {
					resetSettings();
					setIsResetConfirmOpen( false );
				} }
				onCancel={ () => {
					setIsResetConfirmOpen( false );
				} }
				confirmButtonText={ __( 'Reset' ) }
				cancelButtonText={ __( 'Cancel' ) }
			>
				{ __(
					'Are you sure you want to reset all experimental settings to their defaults? This action cannot be undone.'
				) }
			</ConfirmDialog>
		</>
	);
}
