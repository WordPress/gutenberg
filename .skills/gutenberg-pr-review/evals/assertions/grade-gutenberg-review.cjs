function check(label, passed, detail) {
  return {
    pass: Boolean(passed),
    score: passed ? 1 : 0,
    reason: `${label}: ${detail}`,
    namedScores: { [label]: passed ? 1 : 0 },
  };
}

const cases = {
  'block-serialized-markup': [
    {
      label: 'Changed contract',
      test: (text) => /save\.js/.test(text) && /(serializ|saved markup|save output|class name)/.test(text),
      pass: 'identifies the changed serialized output',
      fail: 'does not connect save.js to the serialized markup contract',
    },
    {
      label: 'Existing-content impact',
      test: (text) => /(existing|previously saved|old|previously serialized).{0,50}(posts?|content|blocks?|markup).{0,180}(invalid|validation|unexpected|recovery|fail)/s.test(text)
        || /(invalid|invalidates|validation|unexpected|recovery|fail).{0,140}(existing|previously saved|old|previously serialized).{0,50}(posts?|content|blocks?|markup)/s.test(text),
      pass: 'explains the validation failure for existing content',
      fail: 'does not explain what happens when existing content is reopened',
    },
    {
      label: 'Compatibility remedy',
      test: (text) => /deprecat|migration|preserve.{0,60}(old|existing).{0,40}(markup|class)|keep.{0,60}(old|existing).{0,40}(markup|class)/s.test(text),
      pass: 'requests a compatible serialization or deprecation path',
      fail: 'does not request a compatibility or deprecation path',
    },
    {
      label: 'Regression coverage',
      test: (text) => /(test|fixture).{0,120}(old|existing|previous|deprecated).{0,80}(markup|content|block|serialization)/s.test(text)
        || /(old|existing|previous|deprecated).{0,100}(markup|content|block|serialization).{0,80}(test|fixture)/s.test(text),
      pass: 'requests old-content or deprecated-version coverage',
      fail: 'does not request coverage using previously saved content',
    },
    {
      label: 'File reference',
      test: (text) => /packages\/block-library\/src\/call-to-action\/save\.js/.test(text),
      pass: 'cites the changed save.js file',
      fail: 'does not cite the relevant save.js file',
    },
    {
      label: 'No API-version decoy',
      test: (text) => !/(bump|increment|change).{0,50}(block )?api version|(block )?api version.{0,50}(must|needs?|required).{0,30}(bump|increment|change)/s.test(text),
      pass: 'does not demand an unrelated Block API version bump',
      fail: 'incorrectly demands a Block API version bump',
    },
  ],
  'async-stale-response': [
    {
      label: 'Race identified',
      test: (text) => /(stale|older|earlier|out[- ]of[- ]order).{0,160}(response|request|result).{0,160}(overwrite|replace|win|preview|newer|latest)/s.test(text)
        || /(response|request|result).{0,120}(resolve|complete|finish).{0,80}(out of order|later|last).{0,120}(overwrite|preview|newer|latest)/s.test(text)
        || /(slower|old|older|earlier|previous).{0,100}request.{0,180}(overwrite|replace).{0,100}(current|selected|newer|latest|preview)/s.test(text),
      pass: 'identifies the stale-response race',
      fail: 'does not identify the out-of-order response race',
    },
    {
      label: 'User sequence',
      test: (text) => /(switch|select|change|navigate).{0,100}(template|templateid).{0,180}(old|earlier|previous|first|stale).{0,100}(response|request|result)/s.test(text)
        || /(old|older|earlier|previous|first|stale).{0,80}(response|request|result).{0,120}(resolve|complete|finish).{0,100}(last|later|after|current|newer|selected)/s.test(text)
        || /(response|request|result).{0,100}(out of order|resolve last).{0,100}(current|newer|selected|template)/s.test(text)
        || /(previous|older|slower).{0,100}templateid.{0,180}(current|selected|latest|newer)/s.test(text)
        || /(a.{0,30}(followed by|to).{0,30}b|switching.{0,30}a.{0,30}b).{0,140}(a|first|earlier).{0,80}(resolve|overwrite)/s.test(text),
      pass: 'explains the rapid-template-change failure sequence',
      fail: 'does not explain the user-visible sequence that triggers the race',
    },
    {
      label: 'Lifecycle remedy',
      test: (text) => /abortcontroller|abort signal|cancel|request (id|identity|token)|sequence (id|number)|ignore.{0,80}(stale|old|previous)|cleanup.{0,80}(stale|request)/s.test(text),
      pass: 'suggests cancellation or an equivalent stale-result guard',
      fail: 'does not suggest a credible stale-result guard',
    },
    {
      label: 'Race coverage',
      test: (text) => /(test|coverage).{0,200}(out[- ]of[- ]order|resolve.{0,50}(later|last|after)|rapid.{0,40}(switch|change|select)|stale|changes?.{0,40}templateid.{0,60}(pending|before))/s.test(text)
        || /(out[- ]of[- ]order|deferred[- ]promise|both requests pending).{0,100}(test|coverage|race)/s.test(text),
      pass: 'requests a test that controls completion order',
      fail: 'does not request meaningful race-condition coverage',
    },
    {
      label: 'File reference',
      test: (text) => /packages\/editor\/src\/hooks\/use-template-preview\.js/.test(text),
      pass: 'cites the changed hook',
      fail: 'does not cite the relevant hook',
    },
    {
      label: 'No dependency decoy',
      test: (text) => !/(missing|add|include).{0,70}templateid.{0,70}dependenc|dependenc.{0,70}(missing|omit).{0,70}templateid/s.test(text),
      pass: 'does not claim templateId is absent from the dependency array',
      fail: 'incorrectly claims templateId is missing from the dependency array',
    },
  ],
  'rest-false-update': [
    {
      label: 'False-value defect',
      test: (text) => /(false|turn.{0,20}off|disable).{0,180}(skip|ignore|not|never|remain|stay|unchanged|true)/s.test(text)
        || /(skip|ignore|not update|never update|remain|stay).{0,140}(false|turn.{0,20}off|disable)/s.test(text),
      pass: 'explains why an explicit false value is not saved',
      fail: 'does not explain the true-to-false update failure',
    },
    {
      label: 'Truthiness cause',
      test: (text) => /truthiness|truthy|falsy|presence.{0,80}(value|truth)|has_param|array_key_exists|if \(.{0,50}allow_comments/s.test(text),
      pass: 'connects the failure to the truthiness guard',
      fail: 'does not identify the truthiness-versus-presence mistake',
    },
    {
      label: 'Presence-aware remedy',
      test: (text) => /has_param|array_key_exists|parameter (is )?present|check.{0,50}presence|update.{0,80}(unconditionally|regardless)|distinguish.{0,80}(presence|provided).{0,80}(truth|value)/s.test(text),
      pass: 'suggests a presence-aware or unconditional update',
      fail: 'does not suggest a fix that preserves explicit false',
    },
    {
      label: 'Regression coverage',
      test: (text) => /(test|coverage).{0,300}(true.{0,30}(to|→).{0,30}false|turn.{0,30}off|disable|explicit false|send.{0,40}false|submit.{0,40}false|open.{0,80}false.{0,80}closed)/s.test(text),
      pass: 'requests a true-to-false regression test',
      fail: 'does not request coverage for an explicit false update',
    },
    {
      label: 'File reference',
      test: (text) => /lib\/experimental\/class-site-settings-controller\.php/.test(text),
      pass: 'cites the changed REST controller',
      fail: 'does not cite the relevant controller',
    },
    {
      label: 'No security decoy',
      test: (text) => !/(missing|lacks?|add|needs?|must have).{0,60}(permission_callback|permission callback|sanitiz)|(?:permission_callback|permission callback|sanitiz).{0,60}(missing|absent|required)/s.test(text),
      pass: 'does not invent missing permission or sanitization checks',
      fail: 'incorrectly reports missing permissions or sanitization',
    },
  ],
};

module.exports = (output, context) => {
  const caseName = context?.vars?.case;
  const definition = cases[caseName];
  if (!definition) {
    return {
      pass: false,
      score: 0,
      reason: `Unknown Gutenberg review case: ${caseName || '(missing)'}`,
    };
  }

  const text = String(output || '').toLowerCase();
  const components = definition.map((item) => {
    const passed = item.test(text);
    return check(item.label, passed, passed ? item.pass : item.fail);
  });
  const score = components.reduce((sum, item) => sum + item.score, 0) / components.length;

  return {
    pass: score === 1,
    score,
    reason: `${Math.round(score * 100)}% of seeded review checks passed`,
    componentResults: components,
  };
};
