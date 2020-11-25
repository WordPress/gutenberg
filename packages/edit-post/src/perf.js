/**
 * External dependencies
 */
import React from 'react';

const performanceNow = require( 'fbjs/lib/performanceNow' );

// Construct a simple trace record
const traceRecord = ( {
	name,
	time: ts,
	tag = null,
	instanceKey = 0,
	tid = 0,
	pid = 0,
} ) => ( {
	cat: 'react-native',
	ph: 'I',
	name,
	ts,
	pid,
	tid,
	args: {
		instanceKey,
		tag,
	},
} );

// Gets the logs that Java sends from ReactMarker and converts them into the format that
// chrome://tracing can understand.
// Note that we should not really do this on the device, but send the data to the server
// and the server to change the format
const logsToTrace = ( logs, epochStart ) => {
	const findClosingEventTime = (
		{ name, args: { tag, instanceKey } },
		index,
		records
	) => {
		if (
			name === 'CREATE_MODULE_START' ||
			name === 'CONVERT_CONSTANTS_START' ||
			name === 'GET_CONSTANTS_START'
		) {
			// Some events like the above do not have all the information to be associated with the
			// end event. In that case, we look for the first matching end event with the same name
			// and assume that it would be the end event.
			// This will be fixed in React Native soon
			for ( let i = index; i < records.length; i++ ) {
				if ( records[ i ].name === name.replace( /_START$/, '_END' ) ) {
					return records[ i ].time;
				}
			}
		} else {
			// For most events, we just look for the name, tag and instance to match, to
			// find the closing event
			const endEvents = records.filter(
				( e ) =>
					e.name.endsWith( '_END' ) &&
					e.name.replace( /_END$/, '_START' ) === name &&
					// Either the tag, or the instance, or both will match for the end tag
					( e.tag ? e.tag === tag : e.instanceKey === instanceKey )
			);
			if ( endEvents.length === 1 ) {
				return endEvents[ 0 ].time;
			}
		}
		if ( __DEV__ ) {
			console.log(
				'Could not find the ending event for ',
				name,
				tag,
				instanceKey
			);
		}
	};

	const traceEvents = [];
	// Iterate over each element find its closing event, and add that to the list of traceEvents
	logs.forEach( ( record, index ) => {
		//console.log(JSON.stringify(record));
		const event = traceRecord( {
			...record,
			time: record.time - epochStart,
		} );
		if ( record.name.endsWith( '_START' ) ) {
			const endTime = findClosingEventTime( event, index, logs );
			if ( typeof endTime !== 'undefined' ) {
				event.ph = 'X';
				event.dur = endTime - record.time;
			}
			event.name = record.name.replace( /_START$/, '' );
			traceEvents.push( event );
		} else if ( event.name.endsWith( '_END' ) ) {
			// Nothing to do for end event, we have already processed it
		} else {
			// This is an instant event - an event without a close. We just log this
			traceEvents.push( event );
		}
	} );
	return traceEvents;
};

let jsStartTime = performanceNow();
// Function to convert raw logs to a format that chrome://tracing can consume.
// Ideally this should be done at the server, not on the device
const getTrace = () => {
	const trace = { traceEvents: [] };
	// Iterate over logs from Java and convert them
	if ( typeof global.AXE_PERFLOGGER !== 'undefined' ) {
		// TODO (me) We currently react logs from ReactMarker that Java sends using a global
		// variable. This should ideally be a native module
		if ( typeof global.AXE_PERFLOGGER.startTime !== 'undefined' ) {
			jsStartTime = global.AXE_PERFLOGGER.startTime;
		}
		if ( typeof global.AXE_PERFLOGGER.data !== 'undefined' ) {
			trace.traceEvents = logsToTrace(
				global.AXE_PERFLOGGER.data,
				jsStartTime
			);
		}
	}

	// Iterate over the JS components logs, and convert them.
	for ( const name in jsTimeSpans ) {
		const { start, end } = jsTimeSpans[ name ];
		const event = traceRecord( {
			name,
			time: start - jsStartTime,
			tag: 'JS_EVENT',
		} );
		event.ph = 'X';
		event.dur = end - start;
		trace.traceEvents.push( event );
	}
	return trace;
};

// A helper to record timespans that JS components send us
const jsTimeSpans = {};
const TimeSpan = {
	start( name ) {
		jsTimeSpans[ name ] = { start: performanceNow() };
	},
	stop( name ) {
		const timespan = jsTimeSpans[ name ];
		if ( typeof timespan !== 'undefined' ) {
			jsTimeSpans[ name ] = { ...timespan, end: performanceNow() };
		}
	},
};

// A simple component to record the time taken to construct and mount JS components
class ComponentLogger extends React.Component {
	_hasLoggedUpdate = false;
	constructor( props ) {
		super( props );
		const { name, type } = this.props;
		TimeSpan[ type ]( name + '_mount' );
	}

	shouldComponentUpdate() {
		if ( ! this._hasLoggedUpdate ) {
			const { name, type } = this.props;
			this._hasLoggedUpdate = true;
			TimeSpan[ type ]( name + '_update' );
		}
		return false;
	}

	render() {
		return null;
	}
}

module.exports = {
	// Use this function in your JS code to instrument load time. Usage is
	// render() { logComponentPerf('Component_NAME', <Component ...props />); }
	logComponentPerf( name, component ) {
		return (
			<>
				<ComponentLogger type="start" name={ name } />
				{ component }
				<ComponentLogger type="stop" name={ name } />
			</>
		);
	},
	getTrace,
};

// TODO (me) This should not happen on a timeout, but when TTI or loading completes.
// We could do that by adding a callback on the component that marks the end
// of loading.
// global.setTimeout( () => {
// TODO (app) Change this to your app's server, that can recieve trace.json
// fetch( 'http://localhost:3000', {
// 	method: 'POST',
// 	body: JSON.stringify( getTrace() ),
// } );
// console.log( JSON.stringify( getTrace() ) );
// }, 10000 );
