/** Test file for making text from first person to third person. */

const nlp = require('compromise');

const texts = [
    'I am a test user.',
    'I am a test user. I am a software engineer.',
    'I\'ll be back soon.',
    'but yeah i understand why the bot can\'t get you here, but i do wish it was opt in system yknow? but i can get why that would be frustrating',
    'also hello, i know i could tupper, but i prefer being forced',
    'im not sure if i can do that, but i can try',
    'Mine is the best.',
    'I like big butts and I cannot lie.',
];
const user = 'Test User';
const userPronouns = {
    
    'me': user,
    'my': `${user}'s`,
    'mine': `${user}'s`,
    'myself': `${user}'s self`,
    'im': `${user} is`,
    'i\'m': `${user} is`,
    'i am': `${user} is`,
    'i\'ve': `${user} has`,
    'ive': `${user} has`,
    'i have': `${user} has`,
    'i\'ll': `${user} will`,
    'ill': `${user} will`,
    'i': user,
};

const result = [];

texts.forEach(text => {
    const doc = nlp(text);
    doc.compute('root')
    const edits = doc.match('#Pronoun').growRight('#Infinitive').out('array')
    edits.forEach(edit => {
        const split = edit.split(' ')
        if (split.length < 1) return
        doc.replace(split[1], `${split[1]}s`)
    })
    Object.keys(userPronouns).forEach(pronoun => {
        doc.replace(pronoun, userPronouns[pronoun]);
    });
    
result.push(doc.text());

});

console.log(result);
