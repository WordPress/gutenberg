window.wp = window.wp || {};
window.wp.customize = window.wp.customize || { get: function(){}  };

var customizerRootElement;
customizerRootElement = jQuery( '<div id="customize-theme-controls"><ul></ul></div>' );
customizerRootElement.css( { position: 'absolute', top: -1000 } ); // remove from view
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
			'content': '<li id="customize-control-fixture-control" class="customize-control customize-control-text">\n\t\t\t\t\t\t\t<label>\n\t\t\t\t\t\t\t\t\t\t\t<span class="customize-control-title">Site Title</span>\n\t\t\t\t\t\t\t\t\t\t<input type="text"  value="sWordPress Developssa!" data-customize-setting-link="blogname" />\n\t\t\t\t</label>\n\t\t\t\t\t\t</li>',
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
			'content': '<li id="accordion-panel-fixture-panel" class="accordion-section control-section control-panel control-panel-default">\n\t\t\t<h3 class="accordion-section-title" tabindex="0">\n\t\t\t\tLipsum\t\t\t\t<span class="screen-reader-text">Press return or enter to open this panel</span>\n\t\t\t</h3>\n\t\t\t<ul class="accordion-sub-container control-panel-content">\n\t\t\t\t\t\t<li class="panel-meta accordion-section control-section">\n\t\t\t<div class="accordion-section-title" tabindex="0">\n\t\t\t\t<span class="preview-notice">You are customizing <strong class="panel-title">Lipsum</strong></span>\n\t\t\t</div>\n\t\t\t\t\t\t\t<div class="accordion-section-content description">\n\t\t\t\t\tLorem Ipsum\t\t\t\t</div>\n\t\t\t\t\t</li>\n\t\t\t\t\t</ul>\n\t\t</li>',
			'description': 'Lorem ipsum',
			'instanceNumber': 1,
			'priority': 110,
			'title': 'Lorem Ipsum',
			'type': 'default'
		}
	},
	'sections': {
		'fixture-section': {
			'active': true,
			'content': '<li id="accordion-section-fixture-section" class="accordion-section control-section control-section-default">\n\t\t\t<h3 class="accordion-section-title" tabindex="0">\n\t\t\t\tSite Title &amp; Tagline\t\t\t\t<span class="screen-reader-text">Press return or enter to expand</span>\n\t\t\t</h3>\n\t\t\t<ul class="accordion-section-content">\n\t\t\t\t\t\t\t</ul>\n\t\t</li>',
			'description': '',
			'instanceNumber': 2,
			'panel': 'fixture-panel',
			'priority': 20,
			'title': 'Fixture Section',
			'type': 'default'
		}
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
