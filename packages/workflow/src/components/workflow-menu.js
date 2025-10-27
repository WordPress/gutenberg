/**
 * External dependencies
 */
import { Command, useCommandState } from 'cmdk';
import clsx from 'clsx';

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
} from '@wordpress/components';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { Icon, search as inputIcon } from '@wordpress/icons';
import { executeAbility, store as abilitiesStore } from '@wordpress/abilities';

const inputLabel = __( 'Run abilities and workflows' );

function WorkflowInput( { isOpen, search, setSearch } ) {
	const workflowMenuInput = useRef();
	const _value = useCommandState( ( state ) => state.value );
	const selectedItemId = useMemo( () => {
		const item = document.querySelector(
			`[cmdk-item=""][data-value="${ _value }"]`
		);
		return item?.getAttribute( 'id' );
	}, [ _value ] );
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
			icon={ search }
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
		return allAbilities || [];
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
		( event ) => {
			// Bails to avoid obscuring the effect of the preceding handler(s).
			if ( event.defaultPrevented ) {
				return;
			}

			event.preventDefault();
			setIsOpen( ! isOpen );
		},
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

	const handleExecuteAbility = async ( abilityName ) => {
		setIsExecuting( true );
		const ability = abilities.find( ( a ) => a.name === abilityName );
		try {
			const result = await executeAbility( abilityName );
			setAbilityOutput( {
				abilityName,
				abilityLabel: ability?.label || abilityName,
				abilityDescription: ability?.description || '',
				success: true,
				data: result,
			} );
		} catch ( error ) {
			setAbilityOutput( {
				abilityName,
				abilityLabel: ability?.label || abilityName,
				abilityDescription: ability?.description || '',
				success: false,
				error: error.message || String( error ),
			} );
		} finally {
			setIsExecuting( false );
		}
	};

	const onKeyDown = ( event ) => {
		if (
			// Ignore keydowns from IMEs
			event.nativeEvent.isComposing ||
			// Workaround for Mac Safari where the final Enter/Backspace of an IME composition
			// is `isComposing=false`, even though it's technically still part of the composition.
			// These can only be detected by keyCode.
			event.keyCode === 229
		) {
			event.preventDefault();
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
		return false;
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
				onKeyDown={ onContainerKeyDown }
				tabIndex={ -1 }
				ref={ containerRef }
				role="presentation"
			>
				{ abilityOutput ? (
					<div className="workflows-workflow-menu__output">
						<div className="workflows-workflow-menu__output-header">
							<h3>{ abilityOutput.abilityLabel }</h3>
							{ abilityOutput.abilityDescription && (
								<p className="workflows-workflow-menu__output-hint">
									{ abilityOutput.abilityDescription }
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
					<Command
						label={ inputLabel }
						onKeyDown={ onKeyDown }
						shouldFilter={ false }
					>
						<div className="workflows-workflow-menu__header">
							<Icon
								className="workflows-workflow-menu__header-search-icon"
								icon={ inputIcon }
							/>
							<WorkflowInput
								search={ search }
								setSearch={ setSearch }
								isOpen={ isOpen }
							/>
						</div>
						<Command.List label={ __( 'Workflow suggestions' ) }>
							{ isExecuting && (
								<div className="workflows-workflow-menu__executing">
									{ __( 'Executing ability…' ) }
								</div>
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
											onSelect={ () =>
												handleExecuteAbility(
													ability.name
												)
											}
											id={ ability.name }
										>
											<HStack
												alignment="left"
												className={ clsx(
													'workflows-workflow-menu__item',
													{
														'has-icon':
															ability.icon,
													}
												) }
											>
												{ ability.icon && (
													<Icon
														icon={ ability.icon }
													/>
												) }
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
