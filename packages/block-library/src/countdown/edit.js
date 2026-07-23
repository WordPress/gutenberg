/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
	LinkControl,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	DateTimePicker,
	TextControl,
	SelectControl,
	ColorPalette,
	BaseControl,
} from '@wordpress/components';
import { useState, useEffect, useId } from '@wordpress/element';
import { getSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';

export function getUTCDateFromSiteTime( siteTimeString ) {
	if ( ! siteTimeString ) {
		return null;
	}

	if ( /(Z|[+-]\d{2}:?\d{2})$/.test( siteTimeString ) ) {
		return new Date( siteTimeString );
	}

	const { timezone } = getSettings();
	const asUTC = new Date( `${ siteTimeString }Z` );
	return new Date( asUTC.getTime() - timezone.offset * 60 * 60 * 1000 );
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		endTime,
		showDays,
		showHours,
		showMinutes,
		showSeconds,
		actionOnEnd,
		actionValue,
		bgColor,
		borderColor,
		innerBlocksBehavior,
		isEvergreen,
		evergreenDays,
		evergreenHours,
		evergreenMinutes,
	} = attributes;

	const [ remainingTime, setRemainingTime ] = useState();
	const redirectUrlId = useId();

	useEffect( () => {
		const calculateRemaining = ( difference ) => {
			if ( difference <= 0 ) {
				return null;
			}

			const totalSeconds = Math.floor( difference / 1000 );
			const totalMinutes = Math.floor( totalSeconds / 60 );
			const totalHours = Math.floor( totalMinutes / 60 );
			const totalDays = Math.floor( totalHours / 24 );

			const years = Math.floor( totalDays / 365 );
			const days = years > 0 ? totalDays % 365 : totalDays;
			const hours = showDays ? totalHours % 24 : totalHours;
			const minutes =
				showHours || showDays ? totalMinutes % 60 : totalMinutes;
			const seconds =
				showMinutes || showHours || showDays
					? totalSeconds % 60
					: totalSeconds;

			return { years, days, hours, minutes, seconds };
		};

		if ( isEvergreen ) {
			const durationMs =
				( evergreenDays * 86400 +
					evergreenHours * 3600 +
					evergreenMinutes * 60 ) *
				1000;
			setRemainingTime(
				calculateRemaining( durationMs ) || {
					years: 0,
					days: 0,
					hours: 0,
					minutes: 0,
					seconds: 0,
				}
			);
			return;
		}

		const interval = setInterval( () => {
			const now = new Date();
			const end =
				getUTCDateFromSiteTime( endTime ) ||
				new Date( now.getTime() + 60 * 60 * 1000 );
			const difference = end - now;

			const remaining = calculateRemaining( difference );

			if ( ! remaining ) {
				clearInterval( interval );
				setRemainingTime( null );
			} else {
				setRemainingTime( remaining );
			}
		}, 1000 );

		return () => clearInterval( interval );
	}, [
		endTime,
		isEvergreen,
		evergreenDays,
		evergreenHours,
		evergreenMinutes,
		showDays,
		showHours,
		showMinutes,
		showSeconds,
	] );

	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<PanelBody
					title={ __( 'Countdown Settings' ) }
					className="countdown-settings"
				>
					{ isEvergreen ? (
						<div className="evergreen-duration-controls">
							<TextControl
								type="number"
								label="Days"
								value={ evergreenDays }
								onChange={ ( val ) =>
									setAttributes( {
										evergreenDays: Math.max(
											0,
											parseInt( val, 10 ) || 0
										),
									} )
								}
								min="0"
							/>
							<TextControl
								type="number"
								label="Hours"
								value={ evergreenHours }
								onChange={ ( val ) =>
									setAttributes( {
										evergreenHours: Math.max(
											0,
											parseInt( val, 10 ) || 0
										),
									} )
								}
								min="0"
							/>
							<TextControl
								type="number"
								label="Minutes"
								value={ evergreenMinutes }
								onChange={ ( val ) =>
									setAttributes( {
										evergreenMinutes: Math.max(
											0,
											parseInt( val, 10 ) || 0
										),
									} )
								}
								min="0"
							/>
						</div>
					) : (
						<DateTimePicker
							label={ __( 'End Time' ) }
							currentDate={
								endTime ||
								new Date(
									new Date().getTime() + 60 * 60 * 1000
								)
							}
							onChange={ ( newTime ) =>
								setAttributes( { endTime: newTime } )
							}
						/>
					) }
					<hr />
					<ToggleControl
						label={ __( 'Show Days' ) }
						checked={ showDays }
						onChange={ () =>
							setAttributes( { showDays: ! showDays } )
						}
					/>
					<ToggleControl
						label={ __( 'Show Hours' ) }
						checked={ showHours }
						onChange={ () =>
							setAttributes( { showHours: ! showHours } )
						}
					/>
					<ToggleControl
						label={ __( 'Show Minutes' ) }
						checked={ showMinutes }
						onChange={ () =>
							setAttributes( { showMinutes: ! showMinutes } )
						}
					/>
					<ToggleControl
						label={ __( 'Show Seconds' ) }
						checked={ showSeconds }
						onChange={ () =>
							setAttributes( { showSeconds: ! showSeconds } )
						}
					/>
					<ToggleControl
						label={ __( 'Evergreen Mode' ) }
						checked={ isEvergreen }
						onChange={ () =>
							setAttributes( { isEvergreen: ! isEvergreen } )
						}
						help={ __(
							'Starts a unique countdown for each visitor when they land on the page.'
						) }
					/>
					<hr />
					<SelectControl
						label={ __( 'Action on End' ) }
						value={ actionOnEnd }
						options={ [
							{ value: 'none', label: __( 'Keep at Zero' ) },
							{ value: 'hide', label: __( 'Hide Countdown' ) },
							{
								value: 'showMessage',
								label: __( 'Show Message' ),
							},
							{
								value: 'redirect',
								label: __( 'Redirect to URL' ),
							},
						] }
						onChange={ ( value ) => {
							setAttributes( {
								actionOnEnd: value,
								actionValue:
									actionValue ||
									( value === 'showMessage'
										? __( 'Countdown Ended' )
										: 'https://example.com' ),
							} );
						} }
					/>
					{ actionOnEnd === 'showMessage' && (
						<TextControl
							label={ __( 'Message to Display' ) }
							value={ actionValue }
							onChange={ ( value ) =>
								setAttributes( { actionValue: value } )
							}
							help={
								! actionValue.trim()
									? __( 'Message cannot be empty.' )
									: ''
							}
						/>
					) }
					{ actionOnEnd === 'redirect' && (
						<BaseControl
							label={ __( 'Redirect URL' ) }
							id={ redirectUrlId }
							className="countdown-sidebar-link-control"
						>
							<LinkControl
								searchInputPlaceholder={ __(
									'Search or paste a link…'
								) }
								value={ { url: actionValue } }
								onChange={ ( { url } ) =>
									setAttributes( { actionValue: url } )
								}
								settings={ [] }
								withCreateSuggestion={ false }
							/>
						</BaseControl>
					) }
					{ ! isEvergreen && actionOnEnd !== 'redirect' && (
						<SelectControl
							label={ __( 'Inner Blocks Behavior' ) }
							value={ innerBlocksBehavior }
							options={ [
								{
									value: 'revealOnEnd',
									label: __( 'Reveal when countdown ends' ),
								},
								{
									value: 'hideOnEnd',
									label: __( 'Hide when countdown ends' ),
								},
							] }
							onChange={ ( value ) =>
								setAttributes( { innerBlocksBehavior: value } )
							}
						/>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Appearance Settings' ) }
					initialOpen={ false }
				>
					<p>{ __( 'Background Color' ) }</p>
					<ColorPalette
						value={ bgColor }
						onChange={ ( color ) =>
							setAttributes( { bgColor: color } )
						}
					/>

					<p>{ __( 'Border Color' ) }</p>
					<ColorPalette
						value={ borderColor }
						onChange={ ( color ) =>
							setAttributes( { borderColor: color } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			{ remainingTime || actionOnEnd === 'none' ? (
				<div className="countdown">
					{ remainingTime?.years > 0 && (
						<div
							className="countdown-box countdown-years"
							style={ {
								backgroundColor: bgColor,
								borderColor,
							} }
						>
							<span>{ remainingTime.years }</span>
							<small>{ __( 'Years' ) }</small>
						</div>
					) }
					{ showDays && (
						<div
							className="countdown-box"
							style={ {
								backgroundColor: bgColor,
								borderColor,
							} }
						>
							<span>{ remainingTime?.days || 0 }</span>
							<small>{ __( 'Days' ) }</small>
						</div>
					) }
					{ showHours && (
						<div
							className="countdown-box"
							style={ {
								backgroundColor: bgColor,
								borderColor,
							} }
						>
							<span>{ remainingTime?.hours || 0 }</span>
							<small>{ __( 'Hours' ) }</small>
						</div>
					) }
					{ showMinutes && (
						<div
							className="countdown-box"
							style={ {
								backgroundColor: bgColor,
								borderColor,
							} }
						>
							<span>{ remainingTime?.minutes || 0 }</span>
							<small>{ __( 'Minutes' ) }</small>
						</div>
					) }
					{ showSeconds && (
						<div
							className="countdown-box"
							style={ {
								backgroundColor: bgColor,
								borderColor,
							} }
						>
							<span>{ remainingTime?.seconds || 0 }</span>
							<small>{ __( 'Seconds' ) }</small>
						</div>
					) }
				</div>
			) : (
				<div className="countdown-end-message">
					{ ( actionOnEnd === 'showMessage' && actionValue ) ||
						__( 'Countdown Ended' ) }
				</div>
			) }
			{ ! isEvergreen && actionOnEnd !== 'redirect' && (
				<div className="countdown-inner-blocks-editor">
					<InnerBlocks
						renderAppender={ InnerBlocks.ButtonBlockAppender }
					/>
				</div>
			) }
		</div>
	);
}
