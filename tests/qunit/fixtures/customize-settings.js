window.wp = window.wp || {};
window.wp.customize = window.wp.customize || { get: function(){}  };

var customizerRootElement;
customizerRootElement = jQuery( '<div id="customize-theme-controls"><ul></ul></div>' );
customizerRootElement.css( { position: 'absolute', left: -1000 } ); // remove from view
jQuery( document.body ).append( customizerRootElement );

window._wpCustomizeSettings = {
	'autofocus': {},
	'browser': {
		'ios': false,
		'mobile': false
	},
	'controls': {
		'fixture-control': {
			'active': true,
			'content': '<li id="accordion-section-fixture-section" class="accordion-section control-section control-section-default"> <h3 class="accordion-section-title" tabindex="0"> Section Fixture <span class="screen-reader-text">Press return or enter to open</span> </h3> <ul class="accordion-section-content"> <li class="customize-section-description-container"> <div class="customize-section-title"> <button class="customize-section-back" tabindex="-1"> <span class="screen-reader-text">Back</span> </button> <h3> <span class="customize-action">Customizing &#9656; Fixture Panel</span> Section Fixture </h3> </div> </li> </ul> </li>',
			'description': '',
			'instanceNumber': 8,
			'label': 'Fixture Control',
			'priority': 10,
			'section': 'fixture-section',
			'settings': {
				'default': 'fixture-setting'
			},
			'type': 'text'
		}
	},
	'documentTitleTmpl': 'Customize: %s',
	'nonce': {
		'preview': '',
		'save': ''
	},
	'panels': {
		'fixture-panel': {
			'active': true,
			'content': '<li id="accordion-panel-fixture-panel" class="accordion-section control-section control-panel control-panel-default"> <h3 class="accordion-section-title" tabindex="0"> Fixture Panel <span class="screen-reader-text">Press return or enter to open this panel</span> </h3> <ul class="accordion-sub-container control-panel-content"> <li class="panel-meta customize-info accordion-section cannot-expand"> <button class="customize-panel-back" tabindex="-1"><span class="screen-reader-text">Back</span></button> <div class="accordion-section-title"> <span class="preview-notice">You are customizing <strong class="panel-title">Fixture Panel</strong></span> <button class="customize-help-toggle dashicons dashicons-editor-help" tabindex="0" aria-expanded="false"><span class="screen-reader-text">Help</span></button> </div> </li> </ul> </li>',
			'description': 'Lorem ipsum',
			'instanceNumber': 1,
			'priority': 110,
			'title': 'Fixture panel with content',
			'type': 'default'
		},
		'fixture-panel-default-templated': {
			'active': true,
			'description': 'Lorem ipsum',
			'instanceNumber': 2,
			'priority': 110,
			'title': 'Fixture default panel using template',
			'type': 'default'
		},
		'fixture-panel-titleless-templated': {
			'active': true,
			'description': 'Lorem ipsum',
			'instanceNumber': 3,
			'priority': 110,
			'title': 'Fixture titleless panel using template',
			'type': 'titleless'
		},
		'fixture-panel-reusing-default-template': {
			'active': true,
			'description': 'Lorem ipsum',
			'instanceNumber': 3,
			'priority': 110,
			'title': 'Fixture panel of custom type re-using default template',
			'type': 'reusing-default-template'
		},
		'fixture-panel-without-params': {}
	},
	'sections': {
		'fixture-section': {
			'active': true,
			'content': '<li id="accordion-section-fixture-section" class="accordion-section control-section control-section-default"> <h3 class="accordion-section-title" tabindex="0"> Section Fixture <span class="screen-reader-text">Press return or enter to open</span> </h3> <ul class="accordion-section-content"> <li class="customize-section-description-container"> <div class="customize-section-title"> <button class="customize-section-back" tabindex="-1"> <span class="screen-reader-text">Back</span> </button> <h3> <span class="customize-action">Customizing &#9656; Fixture Panel</span> Section Fixture </h3> </div> </li> </ul> </li>',
			'description': '',
			'instanceNumber': 2,
			'panel': 'fixture-panel',
			'priority': 20,
			'title': 'Fixture Section',
			'type': 'default'
		},
		'fixture-section-default-templated': {
			'active': true,
			'description': '',
			'instanceNumber': 3,
			'panel': 'fixture-panel',
			'priority': 20,
			'title': 'Fixture default section using template',
			'type': 'default'
		},
		'fixture-section-titleless-templated': {
			'active': true,
			'description': '',
			'instanceNumber': 4,
			'panel': 'fixture-panel',
			'priority': 20,
			'title': 'Fixture titleless section using template',
			'type': 'titleless'
		},
		'fixture-section-reusing-default-template': {
			'active': true,
			'description': '',
			'instanceNumber': 4,
			'panel': 'fixture-panel',
			'priority': 20,
			'title': 'Fixture section of custom type re-using default template',
			'type': 'reusing-default-template'
		},
		'fixture-section-without-params': {}
	},
	'settings': {
		'fixture-setting': {
			'transport': 'postMessage',
			'value': 'Lorem Ipsum'
		}
	},
	'theme': {
		'active': true,
		'stylesheet': 'twentyfifteen'
	},
	'url': {
		'activated': 'http://example.org/wp-admin/themes.php?activated=true&previewed',
		'ajax': '/wp-admin/admin-ajax.php',
		'allowed': [
			'http://example.org/'
		],
		'fallback': 'http://example.org/?preview=1&template=twentyfifteen&stylesheet=twentyfifteen&preview_iframe=1&TB_iframe=true',
		'home': 'http://example.org/',
		'isCrossDomain': false,
		'login': 'http://example.org/wp-login.php?interim-login=1&customize-login=1',
		'parent': 'http://example.org/wp-admin/',
		'preview': 'http://example.org/'
	}
};
window._wpCustomizeControlsL10n = {};

jQuery.ajaxSetup( {
	beforeSend: function( e, data ) {
		if ( data.data.indexOf( 'wp_customize' ) !== -1 ) {
			return false;
		}
	}
} );
