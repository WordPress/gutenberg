/**
 * External dependencies
 */
import { Command, useCommandState } from 'cmdk';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Modal,
	TextHighlight,
	__experimentalHStack as HStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { Icon, search as inputIcon } from '@wordpress/icons';
import { executeAbility, store as abilitiesStore } from '@wordpress/abilities';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { withIgnoreIMEEvents } = unlock( componentsPrivateApis );

/**
 * Constants
 */
const EMPTY_ARRAY = [];
const inputLabel = __( 'Run abilities and workflows' );

function WorkflowInput( { isOpen, search, setSearch, abilities } ) {
	const workflowMenuInput = useRef();
	const _value = useCommandState( ( state ) => state.value );
	const selectedItemId = useMemo( () => {
		// Find the ability whose label matches the selected value
		const ability = abilities.find( ( a ) => a.label === _value );
		return ability?.name;
	}, [ _value, abilities ] );
	useEffect( () => {
		// Focus the workflow palette input when mounting the modal.
		if ( isOpen ) {
			workflowMenuInput.current.focus();
		}
	}, [ isOpen ] );
	return (
		<Command.Input
			ref={ workflowMenuInput }
			value={ search }
			onValueChange={ setSearch }
			placeholder={ inputLabel }
			aria-activedescendant={ selectedItemId }
		/>
	);
}

/**
 * @ignore
 */
export function WorkflowMenu() {
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	const [ search, setSearch ] = useState( '' );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ abilityOutput, setAbilityOutput ] = useState( null );
	const [ isExecuting, setIsExecuting ] = useState( false );
	const containerRef = useRef();

	const abilities = useSelect( ( select ) => {
		const allAbilities = select( abilitiesStore ).getAbilities();
		return allAbilities || EMPTY_ARRAY;
	}, [] );

	const filteredAbilities = useMemo( () => {
		if ( ! search ) {
			return abilities;
		}
		const searchLower = search.toLowerCase();
		return abilities.filter(
			( ability ) =>
				ability.label?.toLowerCase().includes( searchLower ) ||
				ability.name?.toLowerCase().includes( searchLower )
		);
	}, [ abilities, search ] );

	// Focus container when output is shown so it can receive keyboard events
	useEffect( () => {
		if ( abilityOutput && containerRef.current ) {
			containerRef.current.focus();
		}
	}, [ abilityOutput ] );

	useEffect( () => {
		registerShortcut( {
			name: 'core/workflows',
			category: 'global',
			description: __( 'Open the workflow palette.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'j',
			},
		} );
	}, [ registerShortcut ] );

	useShortcut(
		'core/workflows',
		/** @type {import('react').KeyboardEventHandler} */
		withIgnoreIMEEvents( ( event ) => {
			// Bails to avoid obscuring the effect of the preceding handler(s).
			if ( event.defaultPrevented ) {
				return;
			}

			event.preventDefault();
			setIsOpen( ! isOpen );
		} ),
		{
			bindGlobal: true,
		}
	);

	const closeAndReset = () => {
		setSearch( '' );
		setIsOpen( false );
		setAbilityOutput( null );
		setIsExecuting( false );
	};

	const goBack = () => {
		setAbilityOutput( null );
		setIsExecuting( false );
		setSearch( '' );
	};

	const handleExecuteAbility = async ( ability ) => {
		setIsExecuting( true );
		try {
			const result = await executeAbility( ability.name );
			setAbilityOutput( {
				name: ability.name,
				label: ability?.label || ability.name,
				description: ability?.description || '',
				success: true,
				data: result,
			} );
		} catch ( error ) {
			setAbilityOutput( {
				name: ability.name,
				label: ability?.label || ability.name,
				description: ability?.description || '',
				success: false,
				error: error.message || String( error ),
			} );
		} finally {
			setIsExecuting( false );
		}
	};

	const onContainerKeyDown = ( event ) => {
		// Handle going back when viewing output
		if (
			abilityOutput &&
			( event.key === 'Escape' ||
				event.key === 'Backspace' ||
				event.key === 'Delete' )
		) {
			event.preventDefault();
			event.stopPropagation();
			goBack();
		}
	};

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			className="workflows-workflow-menu"
			overlayClassName="workflows-workflow-menu__overlay"
			onRequestClose={ abilityOutput ? goBack : closeAndReset }
			__experimentalHideHeader
			contentLabel={ __( 'Workflow palette' ) }
		>
			<div
				className="workflows-workflow-menu__container"
				onKeyDown={ withIgnoreIMEEvents( onContainerKeyDown ) }
				ref={ containerRef }
				//  Tab index and role are needed here to escape the output mode.
				tabIndex={ -1 }
				role="presentation"
			>
				{ abilityOutput ? (
					<div className="workflows-workflow-menu__output">
						<div className="workflows-workflow-menu__output-header">
							<h3>{ abilityOutput.label }</h3>
							{ abilityOutput.description && (
								<p className="workflows-workflow-menu__output-hint">
									{ abilityOutput.description }
								</p>
							) }
						</div>
						<div className="workflows-workflow-menu__output-content">
							{ abilityOutput.success ? (
								<pre>
									{ JSON.stringify(
										abilityOutput.data,
										null,
										2
									) }
								</pre>
							) : (
								<div className="workflows-workflow-menu__output-error">
									<p>{ abilityOutput.error }</p>
								</div>
							) }
						</div>
					</div>
				) : (
					<Command label={ inputLabel } shouldFilter={ false }>
						<HStack className="workflows-workflow-menu__header">
							<Icon
								className="workflows-workflow-menu__header-search-icon"
								icon={ inputIcon }
							/>
							<WorkflowInput
								search={ search }
								setSearch={ setSearch }
								isOpen={ isOpen }
								abilities={ abilities }
							/>
						</HStack>
						<Command.List label={ __( 'Workflow suggestions' ) }>
							{ isExecuting && (
								<HStack
									className="workflows-workflow-menu__executing"
									align="center"
								>
									{ __( 'Executing ability…' ) }
								</HStack>
							) }
							{ ! isExecuting &&
								search &&
								filteredAbilities.length === 0 && (
									<Command.Empty>
										{ __( 'No results found.' ) }
									</Command.Empty>
								) }
							{ ! isExecuting && filteredAbilities.length > 0 && (
								<Command.Group>
									{ filteredAbilities.map( ( ability ) => (
										<Command.Item
											key={ ability.name }
											value={ ability.label }
											className="workflows-workflow-menu__item"
											onSelect={ () =>
												handleExecuteAbility( ability )
											}
											id={ ability.name }
										>
											<HStack alignment="left">
												<span>
													<TextHighlight
														text={ ability.label }
														highlight={ search }
													/>
												</span>
											</HStack>
										</Command.Item>
									) ) }
								</Command.Group>
							) }
						</Command.List>
					</Command>
				) }
			</div>
		</Modal>
	);
}
