import client from '../lib/mongo.js'
import { createSpinner } from 'nanospinner';

function getStart(numbers, field) {
    let result = 0
    if (field.includes(' de ')) result = Math.min.apply(null, numbers)
    else if (field.includes('fim')) result = Math.max.apply(null, numbers)

    return result
}

async function run () {
    const spinner = createSpinner('Connecting MongoDB').start()
    await client.connect()
    spinner.success()
    const db = client.db('tools_api')
    spinner.update({text: 'Grabbing data'}).start()

    const query = {
        'place.complement': {$exists: true, $not:{$eq: ''}}
    }
    const options = {
    };

    const cursor = db.collection('zipcodes').find(query, options)
    const total = await db.collection('zipcodes').countDocuments(query)

    if (total === 0) {
        spinner.success()
        console.log("No documents found!");
        return
    }

    spinner.update({text: `Found ${total} documents`})
    let i = 1

    let bulk = db.collection('zipcodes').initializeOrderedBulkOp()
    for await (const item of cursor) {
        spinner.update({text: `Handling ${i} of ${total}`})
        const field = item.place.complement
        const numbers = Array.from(field.matchAll(/(\d+)/g), m => parseInt(m[0]))
        if (numbers.length > 0) {
            const isEnd = field.includes('fim')
            const endNumber = isEnd ?  Infinity : Math.max.apply(null, numbers)
    
            bulk.find({ "_id": item._id }).updateOne({
                "$set": { 
                    'place.startNumber': getStart(numbers, field),
                    'place.endNumber': endNumber
                }
            });
    
            if (i % 1000 == 0 ) {
                spinner.update({text: `Bulking writing`})
                await bulk.execute();
                bulk = db.collection('zipcodes').initializeOrderedBulkOp()
            }
        }

        i ++;
    }

    await bulk.execute();
      

    spinner.success()
}

export default run