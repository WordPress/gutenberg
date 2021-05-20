const fs = require('fs');
const childProcess = require("child_process");
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

const emails = [
    'Pinar.Olguc@commencis.com', 'abanvillet@studio-goliath.com', 'abderrahman@Abderrahmans-MacBook-Air.local', 'adam@10up.com', 'asmussen@gmail.com', 'bronson@humanmade.co.uk', 'cebid_monkey2@mail.ru', 'channing@automattic.com', 'daniel@relativemarketing.co.uk', 'david.aguilera@neliosoftware.com', 'devin@wordimpress.com', 'eduardo.toledo@automattic.com', 'fabian@fabiantodt.at', 'frank@humanmade.co.uk', 'garrett@eclipse3sixty.com', 'gary@hallme.com', 'github@andreidraganescu.info', 'glen.davies@a8c.com', 'grzegorz.marzencki@a8c.com', 'hello@themebeans.com', 'hi@themesbycarolina.com', 'janvoaldred@hotmail.com', 'jas@src.works', 'jason@o.lan',  'jason@readysetandco.com', 'joemcgill@humanmade.com', 'jonathan.wold@xwp.co', 'jw@werbeagenten.de',  'werbeagenten@WerbeagntensMBP.fritz.box', 'lee@ademti-software.co.uk', 'leutrim.husaj@cm4all.com', 'matt@nyeus.com', 'michael@eventespresso.com', 'mike.pheasant@ephox.com', 'msaeed.ma@gmail.com', 'ned@bight.ca', 'nfmohit49@gmail.com', 'papazoglou.charalampos@gmail.com', 'patrick@artbees.net', 'pratikthink@gmail.com', 'pstonier@salient.com', 'raymondcmjohnson@gmail.com', 'rdorr@beapi.fr', 'riddhi.multidots@gmail.com', 'side-by-side@users.noreply.github.com', 'staci@Stacis-MacBook-Pro.local', 'tammie@automattic.com', 'vadim.nicolai@moduscreate.com', 'vagabond@guest.guest', 'vagrant@homestead', 'vitor@paladini.in', 'wendy.chen@automattic.com'
]

const gitHubUsers = [ 
    '0aveRyan', '2ndkauboy', 'AVGP', 'AdamDTak2112', 'Addison-Stavlo', 'AiratHalitov', 'AlexChariyska', 'Aljullu', 'AmandaRiu', 'AmartyaU', 'AmirS', 'AnthonyLedesma', 'Arash-11', 'ArmandPhilippot', 'ArnaudBan', 'Aurorum', 'BE-Webdesign', 'Baelx', 'Bannerman', 'BenjaminZekavica', 'BronsonQuick', 'Chouby', 'Copons', 'CreativeDive', 'DOUARA', 'DaisyOlsen', 'DannyCooper', 'DaveMoran', 'Designer023', 'DevinWalker', 'DietPawel', 'ElectricFeet', 'EphoxJames', 'Fellner', 'GaryJones', 'GutenDev', 'HardeepAsrani', 'Hypnosphi', 'Ipstenu', 'IreneStr', 'IslamYehia1', 'ItsJonQ', 'JDGrimes', 'JJJ', 'Jackie6', 'JacobMGEvans', 'JarredKennedy', 'JasonHoffmann', 'JeanDavidDaviet', 'JesserH', 'JohnRDOrazio', 'JoshuaDoshua', 'JulienMelissas', 'JustinSainton', 'JustinyAhin', 'KawaiiHannah', 'Kluny', 'LeonBlade', 'Lewiscowles1986', 'Lovor01', 'Luehrsen', 'LuigiPulcini', 'LukePettway', 'MaedahBatool', 'MaggieCabrera', 'Mahjouba91', 'Mamaduka', 'MarcoZehe', 'MarkMarzeotti', 'Mathiu', 'MatzeKitt', 'MehtaRiddhi', 'MichaelArestad', 'MichalKarbownik', 'MohammedFaragallah', 'MotionMaker', 'Naerriel', 'NateWr', 'Nikschavan', 'Olein-jp', 'PareshRadadiya', 'Pierre-Lannoy', 'Pixelrobin', 'Presskopp', 'PypWalters', 'Quintis1212', 'Rahe', 'Rahmon', 'RickorDD', 'Ringish', 'SeanDS', 'SeanMcMillan', 'Sephsekla', 'SergeyBiryukov', 'SergioEstevao', 'Shailee', 'Shelob9', 'Shizumi', 'SiobhyB', 'Sisanu', 'Soean', 'SofiaSousa', 'StevenDufresne', 'Stoyan0v', 'StuartFeldt', 'TeBenachi', 'TimothyBJacobs', 'Tonnie-Exelero', 'Tug', 'WPprodigy', 'Waqas-Ali-Azhar', 'WebPraktikos', 'WodarekLy', 'WunderBart', 'Xyfi', 'ZebulanStanphill', 'a6software', 'aaroncampbell', 'aaronjorbin', 'aaronrobertshaw', 'abaicus', 'abdel-h', 'abdullah1908', 'abhijitrakas', 'adamsilverstein', 'adamziel', 'adekbadek', 'adriacobo', 'aduth', 'afercia', 'agawish', 'ahamed', 'aharish', 'ahmadawais', 'ajitbohra', 'ajlende', 'ajotka', 'akirk', 'akkspros', 'aktasfatih', 'alaczek', 'aladin002dz', 'aldavigdis', 'alexandec', 'alexislloyd', 'alexraby', 'alexsanford', 'alexstine', 'alexwoollam', 'alita-moore', 'allilevine', 'alshakero', 'ambienthack', 'amdrew', 'amedina', 'andreamiddleton', 'andreiglingeanu', 'andreilupu', 'andrewserong', 'andreyc0d3r', 'androb', 'anevins12', 'anjadeubzer', 'annezazu', 'anthonyburchell', 'antonis', 'antpb', 'apeatling', 'apmatthews', 'aprea', 'aristath', 'arjendejong12', 'artpi', 'arunsathiya', 'ashiagr', 'ashwin-pc', 'asvinb', 'atachibana', 'atimmer', 'audrasjb', 'aurooba', 'avillegasn', 'ayoolatj', 'azaozz', 'bappi', 'barryceelen', 'bartczyz', 'bastibeckr', 'becdetat', 'belcherj', 'benlk', 'bfintal', 'bhanu-krenovate', 'bigbassroller', 'billcolumbia', 'bjtitus', 'blowery', 'bmillersw', 'bobbingwide', 'boblinthorst', 'bor0', 'bordoni', 'bosconian-dynamics', 'bph', 'bradyvercher', 'brandonpayton', 'brentswisher', 'brezocordero', 'brijeshb42', 'burhandodhy', 'cagdasdag', 'cameronvoell', 'carlomanf', 'carloslfu', 'carolinan', 'caxco93', 'cburton4', 'ceyhun', 'cguntur', 'chinchang', 'chipsnyder', 'chriskmnds', 'christophherr', 'chrisvanpatten', 'circlecube', 'ck-lee', 'claudiosanches', 'claudiulodro', 'cliffordp', 'code-flow', 'codebykat', 'coderkevin', 'codesue', 'colorful-tones', 'coreymckrill', 'coreyworrell', 'cornedor', 'costasovo', 'cpapazoglou', 'cpiber', 'cr0ybot', 'creativecoder', 'cristian-raiber', 'critterverse', 'csabotta', 'curtisbelt', 'cwood821', 'daddou-ma', 'danhort', 'danielFangstrom', 'danielbachhuber', 'danieldudzic', 'danieltj27', 'daniloercoli', 'davewhitley', 'david-binda', 'david-szabo97', 'davidparkercodes', 'davidshq', 'davidsword', 'davilera', 'davisshaver', 'dcalhoun', 'dd32', 'ddryo', 'dechov', 'delawski', 'delowardev', 'dependabot', 'dependabot[bot]', 'derweili', 'desaiuditd', 'designsimply', 'desrosj', 'devfle', 'dfle04', 'dhruvkb', 'dhurlburtusa', 'diedexx', 'diegohaz', 'diegoreymendez', 'dimadin', 'dimofte', 'dingo-d', 'dixitadusara', 'dlh01', 'dmsnell', 'dom-o', 'donmhico', 'donnapep', 'dorsvenabili', 'dougwollison', 'dphiffer', 'dpkm95', 'draganescu', 'dratwas', 'dsawardekar', 'dsifford', 'dukex', 'earnjam', 'easilyamused', 'ecgan', 'ediamin', 'edmundcwm', 'edschminke', 'eflynn', 'ehg', 'eiriarte', 'elhardoum', 'eliorivero', 'ellatrix', 'emilio-martinez', 'enejb', 'enricobattocchi', 'enriquesanchez', 'ephox-mogran', 'epiqueras', 'ericmurphyxyz', 'etoledom', 'faazshift', 'fabiankaegy', 'fabianpimminger', 'fai-sal', 'faisal-alvi', 'faishal', 'felixarntz', 'felixbaumgaertner', 'ferdiesletering', 'feriforgacs', 'fernandovbs', 'fklein-lu', 'flootr', 'fluiddot', 'folletto', 'foysalremon', 'freakpants', 'fritz-cwp', 'frontdevde', 'frosso', 'fullofcaffeine', 'gaambo', 'gaavar', 'garretthyder', 'gchtr', 'geekpulp', 'georgeh', 'geriux', 'getdave', 'getsource', 'glendaviesnz', 'glingener', 'gonzomir', 'gooklani', 'grappler', 'gravityrail', 'greatislander', 'greenhornet79', 'greenkeeper[bot]', 'gregrickaby', 'gregsullivan', 'grey-rsi', 'grzim', 'gthayer', 'guarani', 'gumacahin', 'gutenbergplugin', 'gwwar', 'gziolo', 'hacknug', 'hansjovis', 'harleyoliver', 'haszari', 'hbrok', 'helen', 'hellofromtonya', 'henryholtgeerts', 'herewithme', 'herregroen', 'hideokamoto', 'hsingyuc', 'huntlyc', 'hypest', 'iamdharmesh', 'iamgabrielma', 'ianbelanger79', 'iandunn', 'ianstewart', 'ice9js', 'ideadude', 'idpokute', 'igorradovanov', 'igorschoester', 'illusaen', 'imath', 'imranhsayed', 'intronic', 'isBatak', 'isabellachen', 'israelshmueli', 'itsjusteileen', 'ixkaito', 'j-falk', 'j-gosch', 'jack-lewin', 'jahvi', 'jakeparis', 'jameskoster', 'jameslnewell', 'jankimoradiya', 'janw-me', 'jasmussen', 'jasonagnew', 'jaswrks', 'javidalkaruzi', 'jayshenk', 'jbinda', 'jblz', 'jd-alexander', 'jdevalk', 'jeff-be', 'jeffersonrabb', 'jeffpaul', 'jeherve', 'jennydupuy', 'jeremyfelt', 'jeryj', 'jessie-ross', 'jessynd', 'jeyip', 'jffng', 'jg314', 'jgcaruso', 'jhalvorson', 'jhnstn', 'jkmassel', 'joanrho', 'jobthomas', 'jodamo5', 'joehills', 'joelclimbsthings', 'joemaller', 'joemcgill', 'johnbillion', 'johndyer', 'johngodley', 'johnmaeda', 'johnstonphilip', 'johnwatkins0', 'jomurgel', 'jonathanbardo', 'jordesign', 'jorgefilipecosta', 'josephchesterton', 'joshuatf', 'jpbelo', 'jpjjulie', 'jrchamp', 'jrtashjian', 'jsnajdr', 'juanfra', 'juanruitina', 'jvisick', 'kadamwhite', 'kadencewp', 'kallehauge', 'kamataryo', 'karmatosed', 'kasparsd', 'kelin1003', 'kellychoffman', 'kelsu02', 'kevin940726', 'kevinwhoffman', 'kienstra', 'kirdia', 'kirilzh', 'kishanjasani', 'kjellr', 'kjohnson', 'koke', 'kopepasah', 'krfreder', 'kuoko', 'lamosty', 'lancewillett', 'lankesh', 'laras126', 'laurelfulford', 'leahkoerper', 'leandroalonso', 'leewillis77', 'lephleg', 'leutrimhusaj', 'lindapaiste', 'ljharb', 'loicblascos', 'lozinska', 'lsl', 'lucasstark', 'luisherranz', 'lukecarbis', 'lukekowalski', 'lukestramasonder', 'lukewalczak', 'm-e-h', 'machouinard', 'mahdiyazdani', 'maheshwaghmare', 'malinajirka', 'manjeet-wisetr', 'manooweb', 'manzoorwanijk', 'mapk', 'marecar3', 'marekhrabe', 'markjaquith', 'mateuswetah', 'mattheu', 'mattwiebe', 'maurobringolf', 'mavinothkumar', 'maximebj', 'maximejobin', 'maxme', 'mayukojpn', 'mberard-smartfire', 'mboynes', 'mchowning', 'mcsf', 'meetjey', 'megubyte', 'mehigh', 'melchoyce', 'mendezcode', 'mgrenierfarmmedia', 'mhull', 'microbit-mark', 'miguelfeliciovieira', 'miina', 'mikehaydon', 'mikejolley', 'mikeselander', 'mikeyarce', 'milesdelliott', 'miminari', 'mimo84', 'mirka', 'mirucon', 'mitogh', 'miya0001', 'mkaz', 'mkevins', 'mlbrgl', 'mmtr', 'mnelson4', 'mohsinr', 'mokagio', 'momotofu', 'moorscode', 'mor10', 'morena', 'morganestes', 'motifsmedia', 'motleydev', 'mrclay', 'mreishus', 'mrleemon', 'mrmadhat', 'msaari', 'mtias', 'mukeshpanchal27', 'munirkamal', 'murshed', 'musus', 'myleshyson', 'mzorz', 'nagayama', 'naogify', 'nateconley', 'nb', 'ndiego', 'nekomajin', 'nerrad', 'nfmohit', 'nickcernis', 'nickylimjj', 'nicolad', 'nielslange', 'niklasp', 'ninio', 'nitishkaila', 'nitrajka', 'njbrown', 'njpanderson', 'noahshrader', 'noahtallen', 'noisysocks', 'nosolosw', 'notnownikki', 'nshki', 'ntsekouras', 'ntwb', 'nukaga', 'null', 'nylen', 'obenland', 'obulat', 'ocean90', 'ockham', 'octalmage', 'oddevan', 'oguzkocer', 'olivervw', 'omarreiss', 'opr', 'orchidGem', 'oskosk', 'oxyc', 'p-jackson', 'paaljoachim', 'pablinos', 'pabloselin', 'parmarhardip', 'patricklindsay', 'pattonwebz', 'paulwilde', 'pavlo-tk', 'pbearne', 'pbking', 'pbrocks', 'pedro-mendonca', 'pento', 'pereirinha', 'peterwilsoncc', 'pglewis', 'phena109', 'philipjohn', 'phpbits', 'phwebi', 'pierlon', 'piersb', 'pinarol', 'pkvillanueva', 'pmbaldha', 'pookapaul', 'postphotos', 'prajapatisagar', 'prashanttholia', 'pratikkry', 'preda-bogdan', 'priethor', 'properlypurple', 'prtksxna', 'psealock', 'pstonier', 'ptasker', 'pvogel2', 'pwkip', 'raajtram', 'rachelbaker', 'rachelmcr', 'rafaelgalani', 'ragnarokatz', 'rahulsprajapati', 'raineorshine', 'rakshans1', 'ramiy', 'ramizmanked', 'ramonjd', 'raquelmsmith', 'ravichdev', 'rbrishabh', 'reason-alex', 'rebeccaj1211', 'redstar504', 'renatho', 'retlehs', 'retrofox', 'retrorism', 'ribaricplusplus', 'richrd', 'richtabor', 'rileybrook', 'riobahtiar', 'rmccue', 'rmorse', 'robertdevore', 'robertsky', 'roborourke', 'rohittm', 'romain-d', 'roo2', 'rosswintle', 'rramo012', 'rsusanto', 'ryanwelcher', 'ryelle', 'ryo-utsunomiya', 'sabernhardt', 'sainthkh', 'saleehk', 'salimserdar', 'sambgordon', 'samikeijonen', 'samueljseay', 'saracope', 'sarahmonster', 'sarayourfriend', 'sbappan', 'sbardian', 'sc81', 'schlessera', 'scruffian', 'senadir', 'ser-manjeet', 'sewmyheadon', 'sgomes', 'shadow351', 'shaikhaezaz80', 'shaileesheth', 'shamimmoeen', 'sharazghouri', 'shaunandrews', 'shaunsantacruz', 'shiki', 'shinyabw', 'shramee', 'siddhantdante', 'sikanderiqbal', 'simison', 'simono', 'sirjonathan', 'sirreal', 'skierpage', 'skorasaurus', 'slushman', 'spacedmonkey', 'stacimc', 'stefanfisk', 'stevehenty', 'stokesman', 'strarsis', 'strategio', 'struna', 'sunnyssr', 'supernovia', 'svenvanhal', 'swissspidy', 't-hamano', 'tacitonic', 'talldan', 'tdlm', 'technote-space', 'tellthemachines', 'tellyworth', 'terriann', 'tfrommen', 'tg-ephox', 'them-es', 'theninabird', 'thiagolcks', 'thisissandip', 'thomashigginbotham', 'thomasplevy', 'thrijith', 'timelsass', 'timmyc', 'timnolte', 'timwright12', 'tiny-james', 'tjnicolaides', 'tmdesigned', 'tmdk', 'tnorthcutt', 'tobias-1815', 'tobifjellner', 'tofumatt', 'tomjn', 'torounit', 'toshotosho', 'travislopes', 'truchot', 'truongwp', 'twsp', 'tyrann0us', 'tyxla', 'uxcodeone', 'vcanales', 'vdwijngaert', 'vindl', 'vipulc2', 'vishalkakadiya', 'vishnugopal', 'vladanost', 'vonloxx', 'voyager131', 'vtrpldn', 'vyskoczilova', 'wallstead', 'walterebert', 'waviaei', 'webmandesign', 'westonruter', 'whyisjake', 'widoz', 'willybahuaud', 'wpscholar', 'xel1045', 'yahilmadakiya', 'yansern', 'yarnoj', 'yoavf', 'yodiyo', 'youknowriad', 'yscik', 'yuliyan', 'zinigor', 'ziyaddin', 'zoliszabo', 'zuk22', 'zzap'
]

function initializeJsonFile(jsonFileName) {

    const toWrite = {
        claimedEmails: {
          description: "The 'handledComments' field represents the databaseId for the comments" +
            "that have been reviewed and do not need to be reviewed again. The 'responses'" +
            " field preserves the responses where a GitHub user has confirmed that they authored" +
            " the commits by one of the unassociated committer email addresses.",
          handledComments: [],
          responses: emails.map( email => ({
              unassociatedCommitterEmail: email,
          }))
        },
        gitHubUserContributors: {
          description: "The 'handledComments' field represents the databaseId for the comments" +
            "that have been reviewed and do not need to be reviewed again. The 'preservedResponses'" +
            " field preserves the responses whether the Gutenberg contributor with the specified `gitHubLogin`" + 
            " has consented to dual-license their past contributions. The consents field is a boolean " + "representing the contributor's response, with `undefined` indicating that no response has been " + 
            "received. The `responses` field records the details of the contributor's response.",
          handledComments: [],
          responses: gitHubUsers.map( user => ({
              gitHubLogin: user,
              consent: undefined // boolean once consent is received.
          }))
        }
    }
    fs.writeFileSync(jsonFileName, JSON.stringify(toWrite))
}

function fetchCommentsCommand(issueId) {
  return `gh api graphql --paginate -f query='
    query ($endCursor: String) {
      repository(owner: "WordPress", name: "gutenberg") {
        issue(number: ${issueId}) {
          comments(first: 100, after: $endCursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              createdAt
              databaseId
              resourcePath
              author {
                login
              }
              bodyText
              editor {
                login
              }
              userContentEdits(first: 100) {
                nodes {
                  createdAt
                  editedAt
                  editor {
                    login
                  }
                  deletedAt
                  deletedBy {
                    login
                  }
                  diff
                }
              }
            }
          }
        }
      }
    }'
  `
}

/**
 * @param {string} command A shell command to execute
 * @return {Promise<string>} A promise that resolve to the output of the shell command, or an error
 * @example const output = await execute("ls -alh");
 */
function execute(command) {
  /**
   * @param {Function} resolve A function that resolves the promise
   * @param {Function} reject A function that fails the promise
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
   */
  return new Promise(function(resolve, reject) {
    /**
     * @param {Error} error An error triggered during the execution of the childProcess.exec command
     * @param {string|Buffer} standardOutput The result of the shell command execution
     * @param {string|Buffer} standardError The error resulting of the shell command execution
     * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
     */
    childProcess.exec(command, function(error, standardOutput, standardError) {
    //   if (error) {
    //     reject();
    //     return;
    //   }

      if (standardError) {
        reject(standardError);
        return;
      }

      resolve(standardOutput);
    });
  });
}

async function pause(ms) {
  if (!ms) ms = 1500
  return new Promise(r => setTimeout(r, ms));
}

async function waitForEnter() {
  return new Promise(resolve => {
    readline.question('Press Enter to continue...', async function (value) {
      resolve(value)
      return
    })
  });
}

// Repeatedly ask the question until one of the expected responses is given. Return that response.
async function ask(text, validResponses) {
    const response = await new Promise(resolve => {
        console.log(`\n${text}`)
        for (const [input,description] of Object.entries(validResponses)) {
            console.log(`\t${input} => ${description}`)
        }

        readline.question('▸ ', async function (value) {
            resolve(value)
            return
        })
    })

    if (Object.keys(validResponses).includes(response)) {
        return response;
    } else {
        console.log(`Your response of '${response}' is not a valid response of ${JSON.stringify(Object.keys(validResponses))}`)
        return await ask(text, validResponses)
    }
}

module.exports = {
  initializeJsonFile,
  fetchCommentsCommand,
  execute,
  pause,
  waitForEnter,
  ask,
}