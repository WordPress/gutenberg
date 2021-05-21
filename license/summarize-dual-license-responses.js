const fs = require('fs')

const json = JSON.parse(fs.readFileSync('dual-license-responses.json'))

// **********************************************************************************************

const consentResponses = json.gitHubUserContributors.responses.reduce((acc, current) => {
    let node;
    switch (current.consent) {
        case true:
            node = acc.consenting
            break;
        case false:
            node = acc.denying
            break;
        case undefined:
            node = acc.noResponse
            break;
    }
    node.push(current.gitHubLogin)
    return acc
}, {
    consenting: [],
    denying: [],
    noResponse: []
})

// const spaced = (obj) => JSON.stringify(obj).replace(/,/g, ', ')
const spaced = (obj) => `${obj}`.replace(/,/g, ', ')

console.log('\n\x1b[30m\x1b[42m'+ 'Consenting users:' + '\x1b[0m\n' + spaced(consentResponses.consenting))
console.log('\n*********\n')
console.log('\x1b[30m\x1b[41m' + 'NON consenting users:' + '\x1b[0m\n' + spaced(consentResponses.denying))
console.log('\n*********\n')
console.log('\n\x1b[30m\x1b[43m' + 'Users who have not responded:' + '\x1b[0m\n' + spaced(consentResponses.noResponse))

// **********************************************************************************************

console.log('\nConsent Responses')
console.table({
    consenting: {number: consentResponses.consenting.length}, 
    'denying consent': {number: consentResponses.denying.length},
    'no response': {number: consentResponses.noResponse.length}
})

const notClaimed = json.claimedEmails.responses.filter(r => r.comment === undefined).length
const total = json.claimedEmails.responses.length
const claimed = total - notClaimed

console.log('\nUnassociated emails')
console.table({
    'email has been claimed by GitHub user': { number: claimed },
    'email remains unclaimed': { number: notClaimed },
})

// **********************************************************************************************

const statusFileContent = `# Current Status

## Unassociated Emails

| Unassociated Email... | Number |
| --- | --- |
| Email Has Been Claimed By a GitHub User | ${claimed} |
| Email Remains Unclaimed | ${notClaimed} |

## Consent to Dual-License

| Contributor Has | Number |
| --- | --- |
| Consented | ${consentResponses.consenting.length} |
| Denied Consent | ${consentResponses.denying.length} |
| No Response | ${consentResponses.noResponse.length} |

### Users Who Have Consented
${spaced(consentResponses.consenting)}

### Users Who Have Denied Consent
${spaced(consentResponses.denying)}

### Users Who Have Not Responded Yet
${spaced(consentResponses.noResponse)}`

const statusFile = 'status.md'
console.log(`Updating ${statusFile} file...`)
fs.writeFileSync(statusFile, statusFileContent)