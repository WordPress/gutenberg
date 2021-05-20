const fs = require('fs');
const { exit } = require("process");
const {
  initializeJsonFile,
  fetchCommentsCommand,
  execute,
  pause,
  waitForEnter,
  ask
} = require('./utils')

async function fetchCommentsFor(issueId) {
    try {
        const fetchCommand = fetchCommentsCommand(issueId)
        const results = await execute(fetchCommand)
        // return JSON.parse(results).data.repository.issue.comments.nodes
        return evaluatePaginatedJsonString(results)
    } catch (err) {
        console.error(err.toString())
    }
}

async function handleClaimEmailIssueComment(comment) {
    if (preservedJson.claimedEmails.handledComments.includes(comment.databaseId)) {
        // do nothing if we've previously handled this comment
        return;
    }

    const author = comment.author.login
    console.clear()
    await pause(200)
    console.log(`Received the following comment from ${author}:\n`)
    console.log('********************\n')
    console.log('\x1b[1m%s\x1b[0m', `${comment.bodyText}\n`)
    console.log('********************\n')

    const commentClaimsOwnership = (claim) => {
        claim.comment = {
            gitHubLogin: author,
            date: comment.createdAt,
            id: comment.databaseId,
            path: comment.resourcePath,
            text: comment.bodyText,
            preservedToJsonOn: new Date().toISOString()
        }
        claim.usersDeniedBeingAuthor = undefined
    }

    let handled = false
    for (claim of preservedJson.claimedEmails.responses) {
        const email = claim.unassociatedCommitterEmail.toLowerCase()

        // found matching phrase - automatically claim email
        const lowerCaseMagicPhrase = `i am the author of all gutenberg commits from ${email}`
        if (comment.bodyText.toLowerCase() == lowerCaseMagicPhrase ||
            comment.bodyText.toLowerCase() == lowerCaseMagicPhrase + '.') {
                handled = true;
                console.log('\x1b[30m\x1b[42m%s\x1b[0m', `Found the magic phrase, so automatically preserving this comment as claiming ownership of ${email}`)
                // await pause()
                commentClaimsOwnership(claim)

        // found matching email - confirm whether to claim, deny, or skip
        } else if (comment.bodyText.toLowerCase().includes(email.toLowerCase())) {
            handled = true;
            console.log('\x1b[46m\x1b[30m%s\x1b[0m', `This body text appears to match the email '${email}'`)

            const answer = await ask('What should we do?', {
                'c': `This comment CLAIMS authorship of the commits associated with ${email}`,
                'd': 'This comment DENIES authorship',
                's': 'Skip this comment because it NEITHER claims nor denies authorship'
            })

            switch (answer) {
                // claims authorship
                case 'c': 
                    console.log(`\nRecording that @${author} is the author of commits from ${email}...`)
                    await pause()
                    commentClaimsOwnership(claim)
                    break;

                // denies authorship
                case 'd':
                    console.log(`\nRecording that @${author} IS NOT the author of commits from ${email}...`)
                    await pause()
                    if (!claim.usersDeniedBeingAuthor) claim.usersDeniedBeingAuthor = []
                    claim.usersDeniedBeingAuthor.push({
                        gitHubLogin: author,
                        date: comment.createdAt,
                        id: comment.databaseId,
                        path: comment.resourcePath,
                        text: comment.bodyText,
                        preservedToJsonOn: new Date().toISOString()
                    })
                    break;

                // skip
                case 's':
                    console.log('\nSkipping...')
                    await pause()
                    // do nothing
                    break;
            } 

        // did not find matching email - skip
        } 
    }

    if (!handled) {
        console.log('This comment does not appear to include any emails. ' + 
                'If we want to preserve this one, we will need to update the json file ' + 
                'MANUALLY. THIS COMMENT WILL BE SKIPPED ON FUTURE RUNS.')
        await waitForEnter()
    }


    // record that this comment has been handled so we don't handle it again.
    preservedJson.claimedEmails.handledComments.push(comment.databaseId);
}

async function handleConsentIssueComment(comment) {
    if (preservedJson.gitHubUserContributors.handledComments.includes(comment.databaseId)) {
        // do nothing if we've previously handled this comment
        return;
    }

    const author = comment.author.login
    console.clear()
    await pause(200)
    console.log(`Received the following comment from ${author}:\n`)
    console.log('********************\n')
    console.log('\x1b[1m%s\x1b[0m', `${comment.bodyText}\n`)
    console.log('********************\n')

    const commentConsentResponse = async function (node, consent) {
        if (node.consent === true) {
          console.log(`\n\nGitHub user ${author} has already consented on ${node.comment.date} with this comment:\n`)
          console.log('\x1b[1m%s\x1b[0m', node.comment.text)
          const answer = await ask('\nDo you want to overwrite this?', {
            'y': 'Overwrite the previous consent comment with the from the new consent.',
            'n': 'Ignore the new comment, leave the previously saved comment unchanged.'
          })

          if (answer === 'n') {
            console.log('Ignoring the new comment')
            pause()
            return
          }
        }

        node.consent = consent
        node.comment = {
            date: comment.createdAt,
            id: comment.databaseId,
            path: comment.resourcePath,
            text: comment.bodyText,
            preservedToJsonOn: new Date().toISOString()
        }
        node.usersDeniedBeingAuthor = undefined
    }

    let handled = false
    for (contributorNode of preservedJson.gitHubUserContributors.responses) {

        // Only check if comment is from a contributor
        if (contributorNode.gitHubLogin !== comment.author.login) {
          continue
        }

        const gitHubLogin = contributorNode.gitHubLogin

        // found matching phrase - automatically record consent 
        const lowerCaseMagicPhrase = 'i irrevocably consent for my past contributions to gutenberg to be dual-licensed under the gnu general public license v2.0 and the mozilla public license version 2.0'
        const lowerCaseComment = comment.bodyText.toLowerCase().trim()
        if (lowerCaseComment === lowerCaseMagicPhrase || 
            lowerCaseComment === lowerCaseMagicPhrase + '.') { 
                handled = true;
                console.log('\x1b[30m\x1b[42m%s\x1b[0m', '*** This comment only contains the magic phrase, so automatically preserving the consent. ***\n')
                // await pause()
                await commentConsentResponse(contributorNode, true)

        } else {
            handled = true;

            if (lowerCaseComment.includes(lowerCaseMagicPhrase)) {
              console.log('\x1b[30m\x1b[46m%s\x1b[0m', '\n*** This comment contains the magic phrase, so it is probably a CONSENT. ***\n')
            } else {
              console.log('\x1b[30m\x1b[43m%s\x1b[0m', '\n*** This comment appears NOT to contain the magic phrase. ***\n')
            }

            const answer = await ask('What should we do?', {
                'c': 'This comment CONSENTS to the dual-license',
                'd': 'This comment DENIES consent',
                's': 'Skip this comment because it NEITHER consents nor denies consent'
            })

            switch (answer) {
                // consents
                case 'c': 
                    console.log(`\nRecording consent by @${gitHubLogin}...`)
                    await pause()
                    await commentConsentResponse(contributorNode, true)
                    break;

                // denies consent
                case 'd':
                    console.log(`\nRecording DENIAL of consent by @${gitHubLogin}...`)
                    await pause()
                    await commentConsentResponse(contributorNode, false)
                    break;

                // skip
                case 's':
                    console.log(`\nSkipping comment by @${gitHubLogin}...`)
                    await pause()
                    break;
            } 
        } 
    }

    if (!handled) {
        console.log('This comment does not appear to be from a Gutenberg contributor. ' + 
                'If we want to do anything with this comment, we need to do it ' + 
                'MANUALLY.\n\nTHIS COMMENT WILL BE SKIPPED ON FUTURE RUNS SO WRITE THIS ' +
                'DOWN IF YOU WANT TO DO ANYTHING WITH IT.')
        console.log('press any character to continue')
        await waitForEnter()
    }


    // record that this comment has been handled so we don't handle it again.
    preservedJson.gitHubUserContributors.handledComments.push(comment.databaseId);
}

// Results with multiple pages come as multiple json objects in the same "string" instead of an
// array of json objects. This functions parses out the comments from those multiple json objects
// and combines them into a json array.
function evaluatePaginatedJsonString(string){
    const beginningOfObject = '{"data":'

    let rest = string
    let stringObjects = []
    while (true) {
        const end = rest.indexOf(`}${beginningOfObject}`)
        if (end === -1) {
          stringObjects.push(rest);
          break;
        } else {
            const object = rest.substring(0, end+1)
            stringObjects.push(object)
            rest = rest.substring(end+1)
        }
    }

    const parsed = stringObjects.map( str =>
        JSON.parse(str).data.repository.issue.comments.nodes
    ).flat(1);

    return parsed;
}

async function main() {
    console.log(`\nThis script does persist any changes to the ${jsonFileName} file until the very end of the script.`)
    console.log('\nIf you make any mistake while running this script, just cancel the script and start over. 😀\n')
    await waitForEnter()

    const Issues = {
        'claim_email': 31913,
        'consent': 31893,
    }

    const claimEmailComments = await fetchCommentsFor(Issues.claim_email)
    for (const comment of claimEmailComments) {
      await handleClaimEmailIssueComment(comment)
    }

    const consentComments = await fetchCommentsFor(Issues.consent)
    for (const comment of consentComments) {
      await handleConsentIssueComment(comment)
    }

    fs.writeFileSync(jsonFileName, JSON.stringify(preservedJson))
    console.log(`Updated ${jsonFileName}`)

    exit(0)
}

const jsonFileName = 'dual-license-responses.json'
// WARNING: 
// only uncomment the following line if you want to overwrite `dual-license-responses.json` and start over
// initializeJsonFile(jsonFileName)

const preservedJson = JSON.parse(fs.readFileSync(jsonFileName))
main()
