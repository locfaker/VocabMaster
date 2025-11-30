const fs = require('fs');
const https = require('https');

// Oxford 3000 - Most important English words
const WORD_LISTS = {
    'IELTS Academic': [
        'abandon', 'abstract', 'academy', 'access', 'accommodate', 'accompany', 'accumulate', 'accurate', 'achieve', 'acknowledge',
        'acquire', 'adapt', 'adequate', 'adjacent', 'adjust', 'administrate', 'adult', 'advocate', 'affect', 'aggregate',
        'aid', 'albeit', 'allocate', 'alter', 'alternative', 'ambiguous', 'amend', 'analogy', 'analyze', 'annual',
        'anticipate', 'apparent', 'append', 'appreciate', 'approach', 'appropriate', 'approximate', 'arbitrary', 'area', 'aspect',
        'assemble', 'assess', 'assign', 'assist', 'assume', 'assure', 'attach', 'attain', 'attitude', 'attribute'
    ],
    'TOEIC Business': [
        'account', 'achieve', 'address', 'adjust', 'administration', 'advantage', 'advertise', 'advice', 'afford', 'agenda',
        'agreement', 'allocate', 'allow', 'alternative', 'analyze', 'annual', 'anticipate', 'apologize', 'appeal', 'applicant',
        'application', 'appointment', 'appreciate', 'approach', 'appropriate', 'approve', 'arrange', 'assessment', 'asset', 'assign',
        'assist', 'associate', 'assume', 'assure', 'attach', 'attend', 'attitude', 'attract', 'authority', 'authorize',
        'available', 'average', 'avoid', 'aware', 'background', 'balance', 'bargain', 'basis', 'behalf', 'benefit'
    ],
    'Daily Conversation': [
        'actually', 'agree', 'almost', 'already', 'always', 'amazing', 'another', 'answer', 'anything', 'anyway',
        'appreciate', 'around', 'arrive', 'awesome', 'beautiful', 'because', 'become', 'before', 'begin', 'believe',
        'between', 'bother', 'bring', 'busy', 'call', 'care', 'carry', 'catch', 'certain', 'chance',
        'change', 'check', 'choose', 'close', 'come', 'complete', 'consider', 'continue', 'correct', 'could',
        'course', 'create', 'decide', 'definitely', 'describe', 'different', 'difficult', 'discuss', 'during', 'early'
    ]
};

async function fetchWordDefinition(word) {
    return new Promise((resolve) => {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (Array.isArray(json) && json[0]) {
                        const entry = json[0];
                        const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || '';
                        const meaning = entry.meanings?.[0];
                        const definition = meaning?.definitions?.[0]?.definition || '';
                        const example = meaning?.definitions?.[0]?.example || '';

                        resolve({
                            term: word,
                            definition: definition,
                            example: example,
                            phonetic: phonetic
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

async function fetchAllWords() {
    const allData = {};

    for (const [deckName, words] of Object.entries(WORD_LISTS)) {
        console.log(`\nFetching ${deckName}...`);
        allData[deckName] = [];

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            process.stdout.write(`  ${i + 1}/${words.length} ${word}...`);

            const data = await fetchWordDefinition(word);
            if (data && data.definition) {
                allData[deckName].push(data);
                console.log(' ✓');
            } else {
                console.log(' ✗');
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, 300));
        }

        console.log(`  Got ${allData[deckName].length} words for ${deckName}`);
    }

    // Save to JSON
    fs.writeFileSync(
        'src/data/vocabulary-data.json',
        JSON.stringify(allData, null, 2),
        'utf8'
    );

    console.log('\n✅ Saved to src/data/vocabulary-data.json');
}

fetchAllWords().catch(console.error);
